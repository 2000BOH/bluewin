// =====================================================
// CSV 임포트 스크립트
// 사용법: node scripts/import-csv.mjs <csv파일경로>
// 예시:   node scripts/import-csv.mjs ./data.csv
//
// Excel에서 저장 시: 파일 → 다른 이름으로 저장 → "CSV UTF-8(쉼표로 구분)(*.csv)"
// 또는 탭 구분(TSV)도 자동 인식
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------
// .env.local 읽기
// ---------------------------
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx < 0) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = val
    }
  } catch {
    console.error('❌ .env.local 파일을 읽을 수 없습니다. Supabase 키를 확인하세요.')
    process.exit(1)
  }
}

// ---------------------------
// CSV/TSV 파싱
// ---------------------------
function parseLine(line, delim) {
  const result = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === delim && !inQ) {
      result.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

function parseCSV(raw) {
  const content = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) { console.error('데이터가 없습니다.'); process.exit(1) }

  const firstLine = lines[0]
  const delim = firstLine.split('\t').length >= firstLine.split(',').length ? '\t' : ','
  console.log(`구분자: ${delim === '\t' ? '탭(TSV)' : '쉼표(CSV)'}`)

  const headers = parseLine(firstLine, delim).map(h => h.trim())
  return lines.slice(1).map((line, i) => {
    const vals = parseLine(line, delim)
    const row = {}
    headers.forEach((h, j) => { row[h] = (vals[j] ?? '').trim() })
    row.__rowNum = i + 2
    return row
  })
}

// ---------------------------
// 값 변환 유틸
// ---------------------------
function toStr(v) {
  const s = (v ?? '').trim()
  return s === '' ? null : s
}

function toNum(v) {
  if (!v || v.trim() === '') return null
  const n = Number(String(v).replace(/[,\s원]/g, ''))
  return isNaN(n) ? null : n
}

function toDate(v) {
  if (!v || v.trim() === '') return null
  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const norm = v.trim().replace(/[./]/g, '-')
  if (/^\d{4}-\d{2}-\d{2}$/.test(norm)) return norm
  // Excel 날짜 시리얼 (숫자)
  const serial = Number(v.trim())
  if (!isNaN(serial) && serial > 40000 && serial < 70000) {
    const d = new Date((serial - 25569) * 86400 * 1000)
    return d.toISOString().slice(0, 10)
  }
  return null
}

function toBool(v) {
  if (!v || v.trim() === '') return false
  return ['y', 'yes', '예', 'o', 'v', 'true', '1', '●', '○', '✓', '있음', '완료'].includes(v.trim().toLowerCase())
}

// ---------------------------
// 메인
// ---------------------------
async function main() {
  loadEnv()

  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('\n사용법: node scripts/import-csv.mjs <csv파일경로>')
    console.error('예시:   node scripts/import-csv.mjs ./계약관리.csv\n')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL 또는 키가 없습니다.')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  let rawCsv
  try {
    rawCsv = readFileSync(resolve(csvPath))
    // UTF-8 BOM 또는 CP949(EUC-KR) 인코딩 시도
    rawCsv = rawCsv.toString('utf-8')
  } catch {
    console.error('❌ 파일을 읽을 수 없습니다:', csvPath)
    process.exit(1)
  }

  const rows = parseCSV(rawCsv)
  console.log(`\n📄 총 ${rows.length}개 행 발견\n`)

  let cntRoom = 0, cntBuyer = 0, cntContract = 0
  const errors = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = r.__rowNum

    try {
      // '1차', '2차' → 1, 2 로 변환
      const phase = Number(String(r['차수'] ?? '').replace(/[^0-9]/g, ''))
      const roomNo = toStr(r['호수'])

      if (!phase || !roomNo) {
        errors.push(`행 ${rowNum}: 차수/호수 없음 → 건너뜀`)
        continue
      }

      // ── 1. rooms 업서트 ──────────────────────────────
      const { error: roomErr } = await supabase
        .from('rooms')
        .upsert(
          {
            phase,
            room_no: roomNo,
            type: toStr(r['타입']),
            view_type: toStr(r['조망']),
            sale_area: toNum(r['분양면적']),
          },
          { onConflict: 'phase,room_no' }
        )
      if (roomErr) throw new Error(`rooms 오류: ${roomErr.message}`)
      cntRoom++

      // ── 2. buyers 업서트 ─────────────────────────────
      const buyerNo = toStr(r['계약자번호'])
      const buyerName = toStr(r['계약자명'])
      if (!buyerNo || !buyerName) {
        errors.push(`행 ${rowNum}: 계약자번호/계약자명 없음 → 계약 건너뜀`)
        continue
      }

      const rawType = toStr(r['개인/법인']) ?? '개인'
      const buyerType = rawType.includes('법인') ? '법인' : '개인'

      const { error: buyerErr } = await supabase
        .from('buyers')
        .upsert({ buyer_no: buyerNo, buyer_type: buyerType, name1: buyerName }, { onConflict: 'buyer_no' })
      if (buyerErr) throw new Error(`buyers 오류: ${buyerErr.message}`)
      cntBuyer++

      // buyer_id 조회
      const { data: buyerRow, error: fetchErr } = await supabase
        .from('buyers')
        .select('id')
        .eq('buyer_no', buyerNo)
        .single()
      if (fetchErr || !buyerRow) throw new Error(`buyer_id 조회 실패 (${buyerNo})`)

      // ── 3. contracts 업서트 ──────────────────────────
      const contractPayload = {
        phase,
        room_no: roomNo,
        buyer_id: buyerRow.id,
        // 탭1 계약기본
        total_supply_amount: toNum(r['총공급금액']),
        contract_status:     toStr(r['계약상태']),
        settlement_date:     toDate(r['계약(잔금)일']),
        contract_form:       toStr(r['계약형태']),
        reverse_issuance:    toBool(r['역발행여부']),
        entrustment_date:    toDate(r['위탁일']),
        // 탭2 운영정보
        operation_type:      toStr(r['운영방식']),
        operation_start:     toDate(r['운영시작일']),
        operation_end:       toDate(r['운영종료일']),
        settlement_amount:   toNum(r['확정지급액']),
        commission_amount:   toNum(r['수수료금액']),
        rent_free_months:    toNum(r['렌트프리기간']),
        stay_agreement:      toBool(r['숙박업동의서']),
        // 탭3 초기비용
        furniture_fee_date:  toDate(r['비품비납입일']),
        prepaid_mgmt_deposit: toNum(r['선수관리비예치금']),
        prepaid_mgmt_fee:    toNum(r['선수관리비납부']),
        joint_purchase_fee:  toNum(r['가구공동구매입금']),
        cash_receipt_reverse: toBool(r['현금영수증역발행']),
        // 탭4 금융/세금
        account_bank:        toStr(r['은행']),
        account_no:          toStr(r['계좌번호']),
        account_holder_name: toStr(r['계좌성명']),
        business_no:         toStr(r['사업자등록번호']),
        business_name:       toStr(r['상호']),
        representative_name: toStr(r['대표자']),
        // 탭5 임차정보
        accommodation_type:  toStr(r['숙박형태']),
        tenant_name:         toStr(r['임차인']),
        tenant_phone:        toStr(r['임차인연락처']),
        deposit_amount:      toNum(r['보증금']),
        monthly_rent:        toNum(r['임대료']),
        lease_start:         toDate(r['임대시작']),
        lease_end:           toDate(r['임대종료']),
        // 탭6 민원/비고
        note:                toStr(r['비고']),
      }

      // (phase, room_no)로 기존 계약 확인 후 upsert
      const { data: existing } = await supabase
        .from('contracts')
        .select('id')
        .eq('phase', phase)
        .eq('room_no', roomNo)
        .eq('buyer_id', buyerRow.id)
        .maybeSingle()

      if (existing) {
        const { error: upErr } = await supabase
          .from('contracts')
          .update(contractPayload)
          .eq('id', existing.id)
        if (upErr) throw new Error(`contracts 수정 오류: ${upErr.message}`)
      } else {
        const { error: insErr } = await supabase
          .from('contracts')
          .insert(contractPayload)
        if (insErr) throw new Error(`contracts 등록 오류: ${insErr.message}`)
      }
      cntContract++

      process.stdout.write(`\r진행 중... ${i + 1}/${rows.length} (${Math.round(((i+1)/rows.length)*100)}%)`)

    } catch (e) {
      errors.push(`행 ${rowNum}: ${e.message}`)
    }
  }

  console.log('\n')
  console.log('='.repeat(40))
  console.log('✅ 임포트 완료')
  console.log('='.repeat(40))
  console.log(`  객실(rooms)    : ${cntRoom}건`)
  console.log(`  계약자(buyers) : ${cntBuyer}건`)
  console.log(`  계약(contracts): ${cntContract}건`)

  if (errors.length > 0) {
    console.log(`\n⚠️  오류 ${errors.length}건:`)
    errors.slice(0, 20).forEach(e => console.log('  -', e))
    if (errors.length > 20) console.log(`  ... 외 ${errors.length - 20}건`)
  } else {
    console.log('\n오류 없이 완료!')
  }
}

main()
