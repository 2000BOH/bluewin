'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { todayKst } from '@/lib/utils/format'
import { loadRnrRules } from '@/lib/queries/rnr'
import { assignRnrByStayType } from '@/lib/utils/rnr'
import { ensureCleaningTaskFromSource, ensureCheckFromSource } from '@/lib/queries/maintenance-link'
import type { StayType } from '@/types/status'
import type { CommonStatus, MaintenanceSourceEnum, RnrStaffNoEnum } from '@/types/supabase'

export type ComplaintFormState = {
  error?: string
  ok?: boolean
  assignedRnrNo?: string | null
  savedContract?: boolean
}

const opt = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim(); return s || null
}
const req = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim(); if (!s) throw new Error(`${name} 필수`); return s
}
const parsePhase = (v: FormDataEntryValue | null): number => {
  const n = Number(v); if (!Number.isFinite(n) || n <= 0) throw new Error('차수 오류'); return n
}
const VALID_STATUSES: CommonStatus[] = ['접수', '입주지원', '영선', '외부업체', '퇴실', '청소', '완료']
const mapStatus = (v: string | null): CommonStatus => {
  if (v && (VALID_STATUSES as string[]).includes(v)) return v as CommonStatus
  // 구버전 호환
  if (v === '영선이관') return '영선'
  if (v === '처리중') return '접수'
  return '접수'
}
const toNum = (v: string | null) => v !== null ? (Number(v.replace(/,/g, '')) || null) : null

const FIELD_KO: Record<string, string> = {
  contract_no: '계약번호', contract_form: '계약형태', contract_date: '계약일',
  contract_status: '계약상태', settlement_date: '정산일', entrustment_date: '위탁일',
  reverse_issuance: '역발행', operation_type: '운영방식',
  operation_start: '운영시작일', operation_end: '운영종료일',
  settlement_amount: '확정지급액', commission_amount: '수수료금액',
  stay_agreement: '숙박동의서', rent_free_months: '렌트프리(개월)',
  initial_cost: '초기비용', move_in_date: '입주일',
  prepaid_mgmt_fee: '선수관리비', furniture_fee: '비품비',
  joint_purchase_fee: '가구공동구매', prepaid_mgmt_deposit: '선수관리예치금',
  cash_receipt_reverse: '현금영수증역발행',
  account_bank: '은행', account_no: '계좌번호', account_holder_name: '계좌성명',
  business_no: '사업자번호', business_name: '상호', representative_name: '대표자',
  accommodation_type: '숙박형태', tenant_name: '임대인', tenant_phone: '임대인연락처',
  deposit_amount: '보증금', monthly_rent: '임대료',
  lease_start: '임대시작', lease_end: '임대종료', note: '비고',
}

async function updateContractInfo(contractId: string, form: FormData, userId: string) {
  const service = createServiceSupabase()

  const { data: old } = await service
    .from('contracts')
    .select('contract_no, contract_form, contract_date, contract_status, settlement_date, entrustment_date, reverse_issuance, operation_type, operation_start, operation_end, settlement_amount, commission_amount, stay_agreement, rent_free_months, initial_cost, move_in_date, prepaid_mgmt_fee, furniture_fee, joint_purchase_fee, prepaid_mgmt_deposit, cash_receipt_reverse, account_bank, account_no, account_holder_name, business_no, business_name, representative_name, accommodation_type, tenant_name, tenant_phone, deposit_amount, monthly_rent, lease_start, lease_end, note')
    .eq('id', contractId).maybeSingle()
  if (!old) return

  const strFields = [
    'contract_no', 'contract_form', 'contract_date', 'contract_status',
    'settlement_date', 'entrustment_date', 'operation_type', 'operation_start', 'operation_end',
    'move_in_date', 'account_bank', 'account_no', 'account_holder_name',
    'business_no', 'business_name', 'representative_name',
    'accommodation_type', 'tenant_name', 'tenant_phone', 'lease_start', 'lease_end', 'note',
  ]
  const numFields = [
    'settlement_amount', 'commission_amount', 'rent_free_months', 'initial_cost',
    'prepaid_mgmt_fee', 'furniture_fee', 'joint_purchase_fee', 'prepaid_mgmt_deposit',
    'deposit_amount', 'monthly_rent',
  ]
  const boolFields = ['reverse_issuance', 'stay_agreement', 'cash_receipt_reverse']

  const historyRows: {
    table_name: string; record_id: string; field_name_ko: string
    old_value: string | null; new_value: string | null; changed_by: string; action: 'update'
  }[] = []

  const record = (key: string, oldVal: unknown, newVal: string | null) => {
    const oldStr = oldVal != null ? String(oldVal) : null
    if (oldStr !== newVal) historyRows.push({
      table_name: 'contracts', record_id: contractId,
      field_name_ko: FIELD_KO[key] ?? key, old_value: oldStr, new_value: newVal,
      changed_by: userId, action: 'update',
    })
  }

  const up: Record<string, string | number | boolean | null> = { updater: userId }
  for (const k of strFields) {
    const v = opt(form.get(k))
    record(k, (old as Record<string, unknown>)[k], v)
    up[k] = v
  }
  for (const k of numFields) {
    const v = toNum(opt(form.get(k)))
    record(k, (old as Record<string, unknown>)[k], v != null ? String(v) : null)
    up[k] = v
  }
  for (const k of boolFields) {
    const raw = opt(form.get(k))
    const v = raw === 'true' ? true : raw === 'false' ? false : (old as Record<string, unknown>)[k] as boolean | null
    const oldBool = (old as Record<string, unknown>)[k]
    if (oldBool !== v) historyRows.push({
      table_name: 'contracts', record_id: contractId,
      field_name_ko: FIELD_KO[k] ?? k,
      old_value: oldBool != null ? String(oldBool) : null,
      new_value: v != null ? String(v) : null,
      changed_by: userId, action: 'update',
    })
    up[k] = v
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await service.from('contracts').update(up as any).eq('id', contractId)
  if (historyRows.length > 0) await service.from('change_history').insert(historyRows)
}

export async function createComplaintAction(
  _prev: ComplaintFormState,
  form: FormData,
): Promise<ComplaintFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const phase = parsePhase(form.get('phase'))
    const room_no = req(form.get('room_no'), '호수')

    const contractId = opt(form.get('contract_id'))
    let savedContract = false
    if (contractId) {
      await updateContractInfo(contractId, form, user.id)
      savedContract = true
    }

    const titleRaw = opt(form.get('title'))
    let rnr_no: RnrStaffNoEnum | null = null
    if (titleRaw) {
      const requester = opt(form.get('requester')) ?? '미입력'
      const content = opt(form.get('content'))
      const action_content = opt(form.get('action_content'))
      const stay_type = opt(form.get('stay_type')) as StayType | null
      const status = mapStatus(opt(form.get('complaint_status')))
      const rules = await loadRnrRules(supabase)
      rnr_no = assignRnrByStayType(stay_type, rules) as RnrStaffNoEnum | null

      const { data: newRow, error } = await supabase.from('maintenance_requests').insert({
        phase, room_no, title: `[${titleRaw}]`, content, requester,
        request_date: todayKst(), urgency: '일반',
        status: status satisfies CommonStatus,
        source: 'complaint' satisfies MaintenanceSourceEnum,
        source_id: null, contract_id: contractId, stay_type, rnr_no,
        assigned_to: null, action_content, completed_at: null, completed_by: null,
        creator: user.id, updater: user.id,
      }).select('id').single()
      if (error) return { error: error.message }

      // 청소 → 객실정비 자동 등록
      if (status === '청소' && newRow) {
        await ensureCleaningTaskFromSource(supabase, {
          phase, room_no, source: 'complaint', source_id: newRow.id,
          requester, summary: `[${titleRaw}]`, detail: content ?? undefined,
          contract_id: contractId, creator: user.id,
        })
        revalidatePath('/room-maintenance')
      }
      // 퇴실 → 객실체크 자동 등록
      if (status === '퇴실' && newRow) {
        await ensureCheckFromSource(supabase, {
          phase, room_no, source: 'complaint', source_id: newRow.id,
          requester, summary: `[${titleRaw}]`, detail: content ?? undefined,
          contract_id: contractId, creator: user.id,
        })
        revalidatePath('/room-check')
      }
    }

    if (!titleRaw && !savedContract) return { error: '분류를 선택하거나 객실정보를 수정해 주세요.' }

    revalidatePath('/complaint')
    revalidatePath('/maintenance/inbox')
    if (rnr_no) revalidatePath(`/rnr/${rnr_no}`)
    return { ok: true, assignedRnrNo: rnr_no ?? null, savedContract }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
