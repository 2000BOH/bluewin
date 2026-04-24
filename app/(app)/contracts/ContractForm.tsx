'use client'

// 계약 등록/수정 폼 — 7개 섹션(탭과 동일 순서)으로 구성.
// 섹션 1 계약기본 / 2 운영정보 / 3 초기비용·입주 / 4 금융·세금 / 5 임차정보 / 6 비고(민원)
// (상세의 ⑦ 수정이력은 조회 전용이므로 폼에는 없음)

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, TextInput, TextArea, Select } from '@/components/common/FormField'
import {
  createContractAction,
  updateContractAction,
  type ContractFormState,
} from './actions'
import type { ContractRow } from '@/lib/queries/contracts'
import { STAY_TYPES } from '@/types/status'

const INITIAL: ContractFormState = {}

type BuyerOption = { id: string; name1: string; buyer_no: string }

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '저장 중...' : label}
    </Button>
  )
}

type Props = {
  mode: 'create' | 'edit'
  initial?: ContractRow | null
  buyers: BuyerOption[]
}

const num = (v: number | null | undefined): string | number =>
  v == null ? '' : v

export default function ContractForm({ mode, initial, buyers }: Props) {
  const action = mode === 'create' ? createContractAction : updateContractAction
  const [state, formAction] = useFormState(action, INITIAL)

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      {/* ① 계약기본 */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">① 계약기본</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="차수" required>
            <TextInput name="phase" type="number" min={1} required defaultValue={initial?.phase ?? ''} />
          </Field>
          <Field label="호수" required>
            <TextInput name="room_no" required defaultValue={initial?.room_no ?? ''} />
          </Field>
          <Field label="계약번호">
            <TextInput name="contract_no" defaultValue={initial?.contract_no ?? ''} />
          </Field>
          <Field label="계약자" required>
            <Select name="buyer_id" required defaultValue={initial?.buyer_id ?? ''}>
              <option value="">선택...</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.buyer_no}] {b.name1}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="계약상태" hint="계약중/계약해지/미계약">
            <Select name="contract_status" defaultValue={initial?.contract_status ?? ''}>
              <option value="">선택</option>
              <option value="계약중">계약중</option>
              <option value="계약해지">계약해지</option>
              <option value="미계약">미계약</option>
            </Select>
          </Field>
          <Field label="계약형태">
            <TextInput name="contract_form" defaultValue={initial?.contract_form ?? ''} />
          </Field>
          <Field label="계약일">
            <TextInput name="contract_date" type="date" defaultValue={initial?.contract_date ?? ''} />
          </Field>
          <Field label="계약(잔금)일">
            <TextInput name="settlement_date" type="date" defaultValue={initial?.settlement_date ?? ''} />
          </Field>
          <Field label="총공급금액">
            <TextInput name="total_supply_amount" inputMode="numeric" defaultValue={num(initial?.total_supply_amount)} />
          </Field>
          <Field label="위탁일">
            <TextInput name="entrustment_date" type="date" defaultValue={initial?.entrustment_date ?? ''} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" name="reverse_issuance" defaultChecked={initial?.reverse_issuance ?? false} />
            역발행
          </label>
        </div>
      </section>

      {/* ② 운영정보 */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">② 운영정보</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="운영방식">
            <TextInput name="operation_type" defaultValue={initial?.operation_type ?? ''} />
          </Field>
          <Field label="운영시작">
            <TextInput name="operation_start" type="date" defaultValue={initial?.operation_start ?? ''} />
          </Field>
          <Field label="운영종료">
            <TextInput name="operation_end" type="date" defaultValue={initial?.operation_end ?? ''} />
          </Field>
          <Field label="확정지급액">
            <TextInput name="settlement_amount" inputMode="numeric" defaultValue={num(initial?.settlement_amount)} />
          </Field>
          <Field label="수수료금액">
            <TextInput name="commission_amount" inputMode="numeric" defaultValue={num(initial?.commission_amount)} />
          </Field>
          <Field label="렌트프리기간(개월)">
            <TextInput name="rent_free_months" type="number" min={0} defaultValue={num(initial?.rent_free_months)} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" name="stay_agreement" defaultChecked={initial?.stay_agreement ?? false} />
            숙박동의서 제출
          </label>
        </div>
      </section>

      {/* ③ 초기비용 / 입주 */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">③ 초기비용 / 입주</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="초기비용 합계">
            <TextInput name="initial_cost" inputMode="numeric" defaultValue={num(initial?.initial_cost)} />
          </Field>
          <Field label="선수관리비납부">
            <TextInput name="prepaid_mgmt_fee" inputMode="numeric" defaultValue={num(initial?.prepaid_mgmt_fee)} />
          </Field>
          <Field label="비품비납입금">
            <TextInput name="furniture_fee" inputMode="numeric" defaultValue={num(initial?.furniture_fee)} />
          </Field>
          <Field label="가구공동구매입금">
            <TextInput name="joint_purchase_fee" inputMode="numeric" defaultValue={num(initial?.joint_purchase_fee)} />
          </Field>
          <Field label="선수관리예치금">
            <TextInput name="prepaid_mgmt_deposit" inputMode="numeric" defaultValue={num(initial?.prepaid_mgmt_deposit)} />
          </Field>
          <Field label="입주일">
            <TextInput name="move_in_date" type="date" defaultValue={initial?.move_in_date ?? ''} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              name="cash_receipt_reverse"
              defaultChecked={initial?.cash_receipt_reverse ?? false}
            />
            현금영수증 역발행
          </label>
        </div>
      </section>

      {/* ④ 금융 / 세금 */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">④ 금융 / 세금</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          ※ 계좌번호·사업자번호는 일반직원에게 상세에서 마스킹되어 표시됩니다.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="은행">
            <TextInput name="account_bank" defaultValue={initial?.account_bank ?? ''} />
          </Field>
          <Field label="계좌성명">
            <TextInput name="account_holder_name" defaultValue={initial?.account_holder_name ?? ''} />
          </Field>
          <Field label="계좌번호">
            <TextInput name="account_no" defaultValue={initial?.account_no ?? ''} />
          </Field>
          <Field label="사업자등록번호">
            <TextInput name="business_no" defaultValue={initial?.business_no ?? ''} />
          </Field>
          <Field label="상호">
            <TextInput name="business_name" defaultValue={initial?.business_name ?? ''} />
          </Field>
          <Field label="대표자">
            <TextInput name="representative_name" defaultValue={initial?.representative_name ?? ''} />
          </Field>
        </div>
      </section>

      {/* ⑤ 임차정보 */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">⑤ 임차정보</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="숙박형태">
            <Select name="accommodation_type" defaultValue={initial?.accommodation_type ?? ''}>
              <option value="">선택</option>
              {STAY_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="임차인">
            <TextInput name="tenant_name" defaultValue={initial?.tenant_name ?? ''} />
          </Field>
          <Field label="임차인 연락처">
            <TextInput name="tenant_phone" defaultValue={initial?.tenant_phone ?? ''} />
          </Field>
          <Field label="보증금">
            <TextInput name="deposit_amount" inputMode="numeric" defaultValue={num(initial?.deposit_amount)} />
          </Field>
          <Field label="임대료">
            <TextInput name="monthly_rent" inputMode="numeric" defaultValue={num(initial?.monthly_rent)} />
          </Field>
          <div />
          <Field label="임대시작">
            <TextInput name="lease_start" type="date" defaultValue={initial?.lease_start ?? ''} />
          </Field>
          <Field label="임대종료">
            <TextInput name="lease_end" type="date" defaultValue={initial?.lease_end ?? ''} />
          </Field>
        </div>
      </section>

      {/* ⑥ 비고 (민원 메모) */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">⑥ 비고 (민원 메모)</h2>
        <Field label="비고" hint="객실 관련 민원 요약 메모. 상세한 민원 이력은 상세의 '민원/비고' 탭에서 관리됩니다.">
          <TextArea name="note" rows={4} defaultValue={initial?.note ?? ''} />
        </Field>
      </section>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={mode === 'edit' && initial ? `/contracts/${initial.id}` : '/contracts'}>취소</Link>
        </Button>
        <Submit label={mode === 'create' ? '등록' : '저장'} />
      </div>
    </form>
  )
}
