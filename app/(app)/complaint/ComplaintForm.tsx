'use client'

// 민원접수 / 객실정보 수정 통합 폼.
// - 차수 1자리 → 호수 자동 포커스
// - 호수 3자리 이상 → 계약 전체 정보 자동 조회·입력
// - 컬럼 펼치기: 계약 전체 컬럼(5개 섹션) 표시 및 수정
// - 분류 미선택 → 객실정보만 저장. 분류 선택 → 민원 등록 + 객실정보 저장

import { useState, useRef, useEffect, useCallback } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import { STAY_TYPES } from '@/types/status'
import { createComplaintAction, type ComplaintFormState } from './actions'

const COMPLAINT_CATEGORIES = [
  '🔐 도어락', '🚿 배관·누수·수도', '❄️ 냉난방·에어컨', '🏠 시설하자·보수',
  '📺 TV·인터넷·셋탑', '🫧 세탁기·인덕션', '🔊 소음·담배·벌레', '⚡ 전기·콘센트',
  '🛏️ 매트리스·가구', '🚗 주차·차량', '📋 계약·관리비', '👥 객실이동·배정', '기타',
] as const

const ACCEPTORS = ['태형', '아름', '동훈', '민수', '남식', '수용', '기타'] as const
const COMPLAINT_STATUSES = ['접수', '처리중', '영선이관', '외부업체', '완료'] as const

const INITIAL: ComplaintFormState = {}

// 계약 전체 컬럼 타입
type ContractInfo = {
  id: string
  // 계약기본
  contract_no: string
  contract_form: string
  contract_date: string
  contract_status: string
  settlement_date: string
  entrustment_date: string
  reverse_issuance: string
  // 운영정보
  operation_type: string
  operation_start: string
  operation_end: string
  settlement_amount: string
  commission_amount: string
  stay_agreement: string
  rent_free_months: string
  // 초기비용/입주
  initial_cost: string
  move_in_date: string
  prepaid_mgmt_fee: string
  furniture_fee: string
  joint_purchase_fee: string
  prepaid_mgmt_deposit: string
  cash_receipt_reverse: string
  // 금융/세금
  account_bank: string
  account_no: string
  account_holder_name: string
  business_no: string
  business_name: string
  representative_name: string
  // 임차정보
  accommodation_type: string
  tenant_name: string
  tenant_phone: string
  deposit_amount: string
  monthly_rent: string
  lease_start: string
  lease_end: string
  note: string
}

const EMPTY_CONTRACT: ContractInfo = {
  id: '', contract_no: '', contract_form: '', contract_date: '', contract_status: '',
  settlement_date: '', entrustment_date: '', reverse_issuance: '',
  operation_type: '', operation_start: '', operation_end: '',
  settlement_amount: '', commission_amount: '', stay_agreement: '', rent_free_months: '',
  initial_cost: '', move_in_date: '', prepaid_mgmt_fee: '', furniture_fee: '',
  joint_purchase_fee: '', prepaid_mgmt_deposit: '', cash_receipt_reverse: '',
  account_bank: '', account_no: '', account_holder_name: '',
  business_no: '', business_name: '', representative_name: '',
  accommodation_type: '', tenant_name: '', tenant_phone: '',
  deposit_amount: '', monthly_rent: '', lease_start: '', lease_end: '', note: '',
}

function Submit({ label = '접수 / 저장' }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
      {pending ? '저장 중...' : label}
    </button>
  )
}

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted/50'
const inputXsCls = 'flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted/50'

type Props = { onRoomChange?: (phase: string, roomNo: string) => void }

export default function ComplaintForm({ onRoomChange }: Props) {
  const [state, formAction] = useFormState(createComplaintAction, INITIAL)
  const formRef = useRef<HTMLFormElement>(null)
  const roomNoRef = useRef<HTMLInputElement>(null)
  const phaseRef = useRef('')
  const roomIsComposing = useRef(false)

  const [phase, setPhase] = useState('')
  const [roomNo, setRoomNo] = useState('')
  const [loadingRoom, setLoadingRoom] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [contract, setContract] = useState<ContractInfo>(EMPTY_CONTRACT)

  const [selectedAcceptor, setSelectedAcceptor] = useState('')
  const [acceptorOther, setAcceptorOther] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const setField = <K extends keyof ContractInfo>(key: K, val: string) =>
    setContract((prev) => ({ ...prev, [key]: val }))

  useEffect(() => {
    if (!state.ok) return
    const parts: string[] = []
    if (state.savedContract) parts.push('객실정보 저장 완료')
    if (state.assignedRnrNo) parts.push(`민원 접수 완료 (R&R ${state.assignedRnrNo}번 배분)`)
    else if (state.assignedRnrNo === null && !state.savedContract) { /* noop */ }
    else if (!state.savedContract) parts.push('민원 접수 완료 (담당자 미배분)')
    setSuccessMsg(parts.join(' · ') || '저장되었습니다.')
    formRef.current?.reset()
    setPhase(''); setRoomNo(''); setContract(EMPTY_CONTRACT)
    setSelectedAcceptor(''); setAcceptorOther('')
    setExpanded(false); setNotFound(false)
    onRoomChange?.('', '')
    const t = setTimeout(() => setSuccessMsg(null), 5000)
    return () => clearTimeout(t)
  }, [state, onRoomChange])

  const fetchRoomInfo = useCallback(async (phaseVal: string, roomNoVal: string) => {
    if (!phaseVal || roomNoVal.trim().length < 3) {
      setContract(EMPTY_CONTRACT); setNotFound(false); return
    }
    setLoadingRoom(true); setNotFound(false)
    try {
      const params = new URLSearchParams({ phase: phaseVal, room_no: roomNoVal.trim() })
      const res = await fetch(`/api/room-info?${params}`)
      const json = await res.json()
      if (!res.ok || json.error || !json.found) {
        setContract(EMPTY_CONTRACT); setNotFound(!json.found)
        return
      }
      const str = (v: unknown) => (v != null ? String(v) : '')
      setContract({
        id: str(json.id),
        contract_no: str(json.contract_no),
        contract_form: str(json.contract_form),
        contract_date: str(json.contract_date),
        contract_status: str(json.contract_status),
        settlement_date: str(json.settlement_date),
        entrustment_date: str(json.entrustment_date),
        reverse_issuance: json.reverse_issuance != null ? String(json.reverse_issuance) : '',
        operation_type: str(json.operation_type),
        operation_start: str(json.operation_start),
        operation_end: str(json.operation_end),
        settlement_amount: str(json.settlement_amount),
        commission_amount: str(json.commission_amount),
        stay_agreement: json.stay_agreement != null ? String(json.stay_agreement) : '',
        rent_free_months: str(json.rent_free_months),
        initial_cost: str(json.initial_cost),
        move_in_date: str(json.move_in_date),
        prepaid_mgmt_fee: str(json.prepaid_mgmt_fee),
        furniture_fee: str(json.furniture_fee),
        joint_purchase_fee: str(json.joint_purchase_fee),
        prepaid_mgmt_deposit: str(json.prepaid_mgmt_deposit),
        cash_receipt_reverse: json.cash_receipt_reverse != null ? String(json.cash_receipt_reverse) : '',
        account_bank: str(json.account_bank),
        account_no: str(json.account_no),
        account_holder_name: str(json.account_holder_name),
        business_no: str(json.business_no),
        business_name: str(json.business_name),
        representative_name: str(json.representative_name),
        accommodation_type: str(json.accommodation_type),
        tenant_name: str(json.tenant_name),
        tenant_phone: str(json.tenant_phone),
        deposit_amount: str(json.deposit_amount),
        monthly_rent: str(json.monthly_rent),
        lease_start: str(json.lease_start),
        lease_end: str(json.lease_end),
        note: str(json.note),
      })
    } catch (e) {
      console.error('[민원] 객실 조회 예외:', e)
      setContract(EMPTY_CONTRACT); setNotFound(true)
    } finally {
      setLoadingRoom(false)
    }
  }, [])

  const handlePhaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPhase(val); phaseRef.current = val
    if (/^\d$/.test(val)) roomNoRef.current?.focus()
    if (roomNo.length >= 3) { fetchRoomInfo(val, roomNo); onRoomChange?.(val, roomNo) }
  }

  const triggerRoomFetch = (val: string) => {
    if (val.length >= 3) { fetchRoomInfo(phaseRef.current, val); onRoomChange?.(phaseRef.current, val) }
    else { setContract(EMPTY_CONTRACT); setNotFound(false); onRoomChange?.(phaseRef.current, '') }
  }

  const handleRoomNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setRoomNo(val)
    // 한글 IME 조합 중에는 fetch 트리거 건너뜀 — compositionend에서 처리
    if (!roomIsComposing.current) triggerRoomFetch(val)
  }

  const isAcceptorOther = selectedAcceptor === '기타'

  return (
    <form ref={formRef} action={formAction} className="rounded-lg border bg-card p-4 space-y-3">

      {/* hidden: contract_id */}
      <input type="hidden" name="contract_id" value={contract.id} />

      {/* ── 차수 / 호수 ── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="차수" required>
          <input name="phase" type="number" min={1} max={9} required autoComplete="off"
            value={phase} onChange={handlePhaseChange} placeholder="예: 1" className={inputCls} />
        </Field>
        <Field label="호수" required>
          <input ref={roomNoRef} name="room_no" required autoComplete="off"
            value={roomNo} onChange={handleRoomNoChange} placeholder="예: 301" className={inputCls}
            onCompositionStart={() => { roomIsComposing.current = true }}
            onCompositionEnd={(e) => {
              roomIsComposing.current = false
              triggerRoomFetch(e.currentTarget.value)
            }} />
        </Field>
      </div>

      {/* ── 객실 정보 (자동조회) ── */}
      <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
        <h3 className="text-[13px] font-bold text-primary/80">
          {loadingRoom ? '🔄 조회 중…' : notFound ? '⚠️ 객실정보 없음' : '✨ 객실 정보 (자동조회)'}
        </h3>

        {/* 기본 필드: 숙박형태 / 임대인 / 임대인 연락처 */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="숙박형태">
            <Select name="stay_type" value={contract.accommodation_type}
              onChange={(e) => setField('accommodation_type', e.target.value)}
              disabled={loadingRoom} className="h-8 py-0 text-xs">
              <option value="">{loadingRoom ? '조회 중…' : '선택'}</option>
              {STAY_TYPES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </Field>
          <Field label="임대인">
            <input name="tenant_name" value={contract.tenant_name}
              onChange={(e) => setField('tenant_name', e.target.value)}
              placeholder={loadingRoom ? '조회 중…' : '미입력'} disabled={loadingRoom}
              className={inputXsCls} />
          </Field>
          <Field label="임대인 연락처">
            <input name="tenant_phone" value={contract.tenant_phone}
              onChange={(e) => setField('tenant_phone', e.target.value)}
              placeholder={loadingRoom ? '조회 중…' : '미입력'} disabled={loadingRoom}
              className={inputXsCls} />
          </Field>
        </div>
      </div>

      {/* ── 접수자 · 분류 · 처리상태 ── */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="접수자">
          <Select name={isAcceptorOther ? '_acceptor_sel' : 'requester'}
            value={selectedAcceptor} onChange={(e) => setSelectedAcceptor(e.target.value)}
            className="h-9 py-0">
            <option value="">선택</option>
            {ACCEPTORS.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          {isAcceptorOther && (
            <TextInput name="requester" required value={acceptorOther}
              onChange={(e) => setAcceptorOther(e.target.value)}
              placeholder="이름 직접 입력" className="mt-1.5 h-9" />
          )}
        </Field>
        <Field label="분류">
          <Select name="title" defaultValue="" className="h-9 py-0">
            <option value="">선택 (민원없음)</option>
            {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="처리상태">
          <Select name="complaint_status" defaultValue="접수" className="h-9 py-0">
            {COMPLAINT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </div>

      {/* ── 내용 / 결과(비고) ── */}
      <Field label="내용">
        <TextArea name="content" rows={3} placeholder="상세 증상, 발생 시점 등" />
      </Field>
      <Field label="결과(비고)">
        <TextArea name="action_content" rows={2} placeholder="처리 결과 또는 비고 사항" />
      </Field>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">{state.error}</p>
      )}
      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
          <span>✓</span><span>{successMsg}</span>
        </div>
      )}

      {/* ── 하단 버튼 행: 컬럼 펼치기(왼쪽) + 접수/저장(오른쪽) ── */}
      <div className="flex items-center justify-between pt-1">
        {contract.id ? (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent">
            {expanded ? '▲ 접기' : '▼ 컬럼 펼치기'}
          </button>
        ) : (
          <span />
        )}
        <Submit />
      </div>

      {/* ── 전체 컬럼 펼치기 영역 (하단 버튼 아래) ── */}
      {expanded && contract.id && (
        <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-4 space-y-5">

          {/* 섹션 1: 계약기본 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">계약기본</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="계약번호">
                <input name="contract_no" value={contract.contract_no}
                  onChange={(e) => setField('contract_no', e.target.value)}
                  placeholder="계약번호" className={inputCls} />
              </Field>
              <Field label="계약형태">
                <input name="contract_form" value={contract.contract_form}
                  onChange={(e) => setField('contract_form', e.target.value)}
                  placeholder="예: 위탁" className={inputCls} />
              </Field>
              <Field label="계약일">
                <input name="contract_date" type="date" value={contract.contract_date}
                  onChange={(e) => setField('contract_date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="계약상태">
                <input name="contract_status" value={contract.contract_status}
                  onChange={(e) => setField('contract_status', e.target.value)}
                  placeholder="예: 계약완료" className={inputCls} />
              </Field>
              <Field label="정산일">
                <input name="settlement_date" type="date" value={contract.settlement_date}
                  onChange={(e) => setField('settlement_date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="위탁일">
                <input name="entrustment_date" type="date" value={contract.entrustment_date}
                  onChange={(e) => setField('entrustment_date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="역발행">
                <Select name="reverse_issuance" value={contract.reverse_issuance}
                  onChange={(e) => setField('reverse_issuance', e.target.value)} className="h-9 py-0">
                  <option value="">선택</option>
                  <option value="true">여</option>
                  <option value="false">부</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* 섹션 2: 운영정보 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">운영정보</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="운영방식">
                <input name="operation_type" value={contract.operation_type}
                  onChange={(e) => setField('operation_type', e.target.value)}
                  placeholder="예: 위탁운영" className={inputCls} />
              </Field>
              <Field label="운영시작일">
                <input name="operation_start" type="date" value={contract.operation_start}
                  onChange={(e) => setField('operation_start', e.target.value)} className={inputCls} />
              </Field>
              <Field label="운영종료일">
                <input name="operation_end" type="date" value={contract.operation_end}
                  onChange={(e) => setField('operation_end', e.target.value)} className={inputCls} />
              </Field>
              <Field label="확정지급액 (원)">
                <input name="settlement_amount" value={contract.settlement_amount}
                  onChange={(e) => setField('settlement_amount', e.target.value)}
                  placeholder="예: 500000" className={inputCls} />
              </Field>
              <Field label="수수료금액 (원)">
                <input name="commission_amount" value={contract.commission_amount}
                  onChange={(e) => setField('commission_amount', e.target.value)}
                  placeholder="예: 50000" className={inputCls} />
              </Field>
              <Field label="숙박동의서">
                <Select name="stay_agreement" value={contract.stay_agreement}
                  onChange={(e) => setField('stay_agreement', e.target.value)} className="h-9 py-0">
                  <option value="">선택</option>
                  <option value="true">제출</option>
                  <option value="false">미제출</option>
                </Select>
              </Field>
              <Field label="렌트프리(개월)">
                <input name="rent_free_months" value={contract.rent_free_months}
                  onChange={(e) => setField('rent_free_months', e.target.value)}
                  placeholder="예: 1" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* 섹션 3: 초기비용/입주 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">초기비용 / 입주</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="초기비용 (원)">
                <input name="initial_cost" value={contract.initial_cost}
                  onChange={(e) => setField('initial_cost', e.target.value)}
                  placeholder="예: 300000" className={inputCls} />
              </Field>
              <Field label="입주일">
                <input name="move_in_date" type="date" value={contract.move_in_date}
                  onChange={(e) => setField('move_in_date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="선수관리비 (원)">
                <input name="prepaid_mgmt_fee" value={contract.prepaid_mgmt_fee}
                  onChange={(e) => setField('prepaid_mgmt_fee', e.target.value)}
                  placeholder="예: 200000" className={inputCls} />
              </Field>
              <Field label="비품비 (원)">
                <input name="furniture_fee" value={contract.furniture_fee}
                  onChange={(e) => setField('furniture_fee', e.target.value)}
                  placeholder="예: 100000" className={inputCls} />
              </Field>
              <Field label="가구공동구매 (원)">
                <input name="joint_purchase_fee" value={contract.joint_purchase_fee}
                  onChange={(e) => setField('joint_purchase_fee', e.target.value)}
                  placeholder="예: 150000" className={inputCls} />
              </Field>
              <Field label="선수관리예치금 (원)">
                <input name="prepaid_mgmt_deposit" value={contract.prepaid_mgmt_deposit}
                  onChange={(e) => setField('prepaid_mgmt_deposit', e.target.value)}
                  placeholder="예: 500000" className={inputCls} />
              </Field>
              <Field label="현금영수증역발행">
                <Select name="cash_receipt_reverse" value={contract.cash_receipt_reverse}
                  onChange={(e) => setField('cash_receipt_reverse', e.target.value)} className="h-9 py-0">
                  <option value="">선택</option>
                  <option value="true">여</option>
                  <option value="false">부</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* 섹션 4: 금융/세금 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">금융 / 세금</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="은행">
                <input name="account_bank" value={contract.account_bank}
                  onChange={(e) => setField('account_bank', e.target.value)}
                  placeholder="예: 국민은행" className={inputCls} />
              </Field>
              <Field label="계좌번호">
                <input name="account_no" value={contract.account_no}
                  onChange={(e) => setField('account_no', e.target.value)}
                  placeholder="계좌번호" className={inputCls} />
              </Field>
              <Field label="계좌성명">
                <input name="account_holder_name" value={contract.account_holder_name}
                  onChange={(e) => setField('account_holder_name', e.target.value)}
                  placeholder="예금주명" className={inputCls} />
              </Field>
              <Field label="사업자번호">
                <input name="business_no" value={contract.business_no}
                  onChange={(e) => setField('business_no', e.target.value)}
                  placeholder="000-00-00000" className={inputCls} />
              </Field>
              <Field label="상호">
                <input name="business_name" value={contract.business_name}
                  onChange={(e) => setField('business_name', e.target.value)}
                  placeholder="상호명" className={inputCls} />
              </Field>
              <Field label="대표자">
                <input name="representative_name" value={contract.representative_name}
                  onChange={(e) => setField('representative_name', e.target.value)}
                  placeholder="대표자명" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* 섹션 5: 임차정보 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">임차정보</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="보증금 (원)">
                <input name="deposit_amount" value={contract.deposit_amount}
                  onChange={(e) => setField('deposit_amount', e.target.value)}
                  placeholder="예: 1000000" className={inputCls} />
              </Field>
              <Field label="임대료 (원)">
                <input name="monthly_rent" value={contract.monthly_rent}
                  onChange={(e) => setField('monthly_rent', e.target.value)}
                  placeholder="예: 500000" className={inputCls} />
              </Field>
              <Field label="임대시작">
                <input name="lease_start" type="date" value={contract.lease_start}
                  onChange={(e) => setField('lease_start', e.target.value)} className={inputCls} />
              </Field>
              <Field label="임대종료">
                <input name="lease_end" type="date" value={contract.lease_end}
                  onChange={(e) => setField('lease_end', e.target.value)} className={inputCls} />
              </Field>
              <Field label="비고" className="col-span-2">
                <TextArea name="note" value={contract.note}
                  onChange={(e) => setField('note', e.target.value)}
                  rows={2} placeholder="계약 관련 메모" />
              </Field>
            </div>
          </div>

        </div>
      )}
    </form>
  )
}
