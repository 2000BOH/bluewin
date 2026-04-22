'use client'

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

export default function ContractForm({ mode, initial, buyers }: Props) {
  const action = mode === 'create' ? createContractAction : updateContractAction
  const [state, formAction] = useFormState(action, INITIAL)

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">계약 / 운영 기본</h2>
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
          <Field label="계약형태">
            <TextInput name="contract_form" defaultValue={initial?.contract_form ?? ''} />
          </Field>
          <Field label="계약일">
            <TextInput name="contract_date" type="date" defaultValue={initial?.contract_date ?? ''} />
          </Field>
          <Field label="운영방식">
            <TextInput name="operation_type" defaultValue={initial?.operation_type ?? ''} />
          </Field>
          <Field label="운영시작">
            <TextInput name="operation_start" type="date" defaultValue={initial?.operation_start ?? ''} />
          </Field>
          <Field label="운영종료">
            <TextInput name="operation_end" type="date" defaultValue={initial?.operation_end ?? ''} />
          </Field>
          <Field label="숙박형태">
            <TextInput name="accommodation_type" defaultValue={initial?.accommodation_type ?? ''} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" name="reverse_issuance" defaultChecked={initial?.reverse_issuance ?? false} />
            역발행
          </label>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">초기비용 / 입주</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="초기비용">
            <TextInput name="initial_cost" inputMode="numeric" defaultValue={initial?.initial_cost ?? ''} />
          </Field>
          <Field label="입주일">
            <TextInput name="move_in_date" type="date" defaultValue={initial?.move_in_date ?? ''} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">금융 / 세금</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="입금은행">
            <TextInput name="account_bank" defaultValue={initial?.account_bank ?? ''} />
          </Field>
          <Field label="계좌번호">
            <TextInput name="account_no" defaultValue={initial?.account_no ?? ''} />
          </Field>
          <Field label="사업자번호">
            <TextInput name="business_no" defaultValue={initial?.business_no ?? ''} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">임차정보</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="임차인">
            <TextInput name="tenant_name" defaultValue={initial?.tenant_name ?? ''} />
          </Field>
          <Field label="임차인 연락처">
            <TextInput name="tenant_phone" defaultValue={initial?.tenant_phone ?? ''} />
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

      <section className="rounded-lg border bg-card p-4">
        <Field label="비고">
          <TextArea name="note" rows={3} defaultValue={initial?.note ?? ''} />
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
