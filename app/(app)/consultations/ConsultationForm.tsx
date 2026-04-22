'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput, TextArea, Select } from '@/components/common/FormField'
import {
  createConsultationAction,
  updateConsultationAction,
  type ConsultationFormState,
} from './actions'
import type { ConsultationRow } from '@/lib/queries/consultations'
import { todayKst } from '@/lib/utils/format'

const INITIAL: ConsultationFormState = {}

type BuyerOpt = { id: string; name1: string; buyer_no: string }

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
  initial?: ConsultationRow | null
  buyers: BuyerOpt[]
  onSuccess: () => void
}

export default function ConsultationForm({ mode, initial, buyers, onSuccess }: Props) {
  const action = mode === 'create' ? createConsultationAction : updateConsultationAction
  const [state, formAction] = useFormState(action, INITIAL)

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <Field label="상담일" required>
          <TextInput
            name="consult_date"
            type="date"
            required
            defaultValue={initial?.consult_date ?? todayKst()}
          />
        </Field>
        <Field label="채널">
          <TextInput name="channel" placeholder="전화/방문/이메일/SMS" defaultValue={initial?.channel ?? ''} />
        </Field>
        <Field label="상담자">
          <TextInput name="consultant" defaultValue={initial?.consultant ?? ''} />
        </Field>
      </div>

      <Field label="제목">
        <TextInput name="title" defaultValue={initial?.title ?? ''} />
      </Field>
      <Field label="상담 내용">
        <TextArea name="content" rows={4} defaultValue={initial?.content ?? ''} />
      </Field>
      <Field label="결과">
        <TextArea name="result" rows={2} defaultValue={initial?.result ?? ''} />
      </Field>
      <Field label="비고">
        <TextArea name="note" rows={2} defaultValue={initial?.note ?? ''} />
      </Field>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Submit label={mode === 'create' ? '등록' : '저장'} />
      </div>
    </form>
  )
}
