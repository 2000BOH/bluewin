'use client'

// 계약관리 인라인 수정 폼.
// 행 펼치기 영역에 표시되어, 모든 계약 컬럼을 한 번에 보고 그대로 편집·저장할 수 있다.
// 섹션 구조는 ContractForm 의 7개 영역과 동일하지만 modal/페이지 이동 없이 인라인으로 처리.

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput, TextArea, Select } from '@/components/common/FormField'
import { inlineUpdateContractAction, type ContractFormState } from './actions'
import type { ContractListItem } from '@/lib/queries/contracts'
import { STAY_TYPES, OPERATION_TYPES } from '@/types/status'

const INITIAL: ContractFormState = {}

type BuyerOption = { id: string; name1: string; buyer_no: string }

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '저장 중...' : '수정'}
    </Button>
  )
}

const num = (v: number | null | undefined): string | number => (v == null ? '' : v)

type Props = {
  row: ContractListItem
  buyers: BuyerOption[]
  onClose: () => void
  onSaved: () => void
}

export default function InlineContractEditor({ row, buyers, onClose, onSaved }: Props) {
  const [state, formAction] = useFormState(inlineUpdateContractAction, INITIAL)

  useEffect(() => {
    if (state.ok) onSaved()
  }, [state, onSaved])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={row.id} />

      {/* ① 계약기본 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">① 계약기본</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="차수" required>
            <TextInput name="phase" type="number" min={1} required defaultValue={row.phase ?? ''} />
          </Field>
          <Field label="호수" required>
            <TextInput name="room_no" required defaultValue={row.room_no ?? ''} />
          </Field>
          <Field label="계약번호">
            <TextInput name="contract_no" defaultValue={row.contract_no ?? ''} />
          </Field>
          <Field label="계약자" required>
            <Select name="buyer_id" required defaultValue={row.buyer_id ?? ''}>
              <option value="">선택...</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.buyer_no}] {b.name1}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="계약상태">
            <Select name="contract_status" defaultValue={row.contract_status ?? ''}>
              <option value="">선택</option>
              <option value="계약중">계약중</option>
              <option value="계약해지">계약해지</option>
              <option value="미계약">미계약</option>
            </Select>
          </Field>
          <Field label="계약일">
            <TextInput name="contract_date" type="date" defaultValue={row.contract_date ?? ''} />
          </Field>
          <Field label="계약(잔금)일">
            <TextInput name="settlement_date" type="date" defaultValue={row.settlement_date ?? ''} />
          </Field>
          <Field label="총공급금액">
            <TextInput name="total_supply_amount" inputMode="numeric" defaultValue={num(row.total_supply_amount)} />
          </Field>
          <Field label="위탁일">
            <TextInput name="entrustment_date" type="date" defaultValue={row.entrustment_date ?? ''} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="reverse_issuance" defaultChecked={row.reverse_issuance ?? false} />
            역발행
          </label>
        </div>
      </section>

      {/* ② 운영정보 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">② 운영정보</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="운영방식">
            <Select name="operation_type" defaultValue={row.operation_type ?? ''}>
              <option value="">선택</option>
              {OPERATION_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="운영시작">
            <TextInput name="operation_start" type="date" defaultValue={row.operation_start ?? ''} />
          </Field>
          <Field label="운영종료">
            <TextInput name="operation_end" type="date" defaultValue={row.operation_end ?? ''} />
          </Field>
          <Field label="확정지급액">
            <TextInput name="settlement_amount" inputMode="numeric" defaultValue={num(row.settlement_amount)} />
          </Field>
          <Field label="수수료금액">
            <TextInput name="commission_amount" inputMode="numeric" defaultValue={num(row.commission_amount)} />
          </Field>
          <Field label="렌트프리(개월)">
            <TextInput name="rent_free_months" type="number" min={0} defaultValue={num(row.rent_free_months)} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="stay_agreement" defaultChecked={row.stay_agreement ?? false} />
            숙박동의서
          </label>
        </div>
      </section>

      {/* ③ 초기비용 / 입주 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">③ 초기비용 / 입주</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="초기비용">
            <TextInput name="initial_cost" inputMode="numeric" defaultValue={num(row.initial_cost)} />
          </Field>
          <Field label="선수관리비">
            <TextInput name="prepaid_mgmt_fee" inputMode="numeric" defaultValue={num(row.prepaid_mgmt_fee)} />
          </Field>
          <Field label="비품비">
            <TextInput name="furniture_fee" inputMode="numeric" defaultValue={num(row.furniture_fee)} />
          </Field>
          <Field label="가구공동구매">
            <TextInput name="joint_purchase_fee" inputMode="numeric" defaultValue={num(row.joint_purchase_fee)} />
          </Field>
          <Field label="선수관리예치금">
            <TextInput name="prepaid_mgmt_deposit" inputMode="numeric" defaultValue={num(row.prepaid_mgmt_deposit)} />
          </Field>
          <Field label="입주일">
            <TextInput name="move_in_date" type="date" defaultValue={row.move_in_date ?? ''} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="cash_receipt_reverse" defaultChecked={row.cash_receipt_reverse ?? false} />
            현금영수증 역발행
          </label>
        </div>
      </section>

      {/* ④ 금융 / 세금 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">④ 금융 / 세금</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="은행">
            <TextInput name="account_bank" defaultValue={row.account_bank ?? ''} />
          </Field>
          <Field label="계좌성명">
            <TextInput name="account_holder_name" defaultValue={row.account_holder_name ?? ''} />
          </Field>
          <Field label="계좌번호">
            <TextInput name="account_no" defaultValue={row.account_no ?? ''} />
          </Field>
          <Field label="사업자등록번호">
            <TextInput name="business_no" defaultValue={row.business_no ?? ''} />
          </Field>
          <Field label="상호">
            <TextInput name="business_name" defaultValue={row.business_name ?? ''} />
          </Field>
          <Field label="대표자">
            <TextInput name="representative_name" defaultValue={row.representative_name ?? ''} />
          </Field>
        </div>
      </section>

      {/* ⑤ 임차정보 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">⑤ 임차정보</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="숙박형태">
            <Select name="accommodation_type" defaultValue={row.accommodation_type ?? ''}>
              <option value="">선택</option>
              {STAY_TYPES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
          </Field>
          <Field label="임차인">
            <TextInput name="tenant_name" defaultValue={row.tenant_name ?? ''} />
          </Field>
          <Field label="임차인 연락처">
            <TextInput name="tenant_phone" defaultValue={row.tenant_phone ?? ''} />
          </Field>
          <Field label="보증금">
            <TextInput name="deposit_amount" inputMode="numeric" defaultValue={num(row.deposit_amount)} />
          </Field>
          <Field label="임대료">
            <TextInput name="monthly_rent" inputMode="numeric" defaultValue={num(row.monthly_rent)} />
          </Field>
          <Field label="임대시작">
            <TextInput name="lease_start" type="date" defaultValue={row.lease_start ?? ''} />
          </Field>
          <Field label="임대종료">
            <TextInput name="lease_end" type="date" defaultValue={row.lease_end ?? ''} />
          </Field>
        </div>
      </section>

      {/* ⑥ 비고 (민원) */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">⑥ 비고 (민원)</h3>
        <Field label="비고">
          <TextArea name="note" rows={2} defaultValue={row.note ?? ''} />
        </Field>
      </section>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          취소
        </Button>
        <Submit />
      </div>
    </form>
  )
}
