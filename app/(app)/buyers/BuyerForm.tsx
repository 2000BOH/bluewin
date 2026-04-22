'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput, TextArea, Select } from '@/components/common/FormField'
import { createBuyerAction, updateBuyerAction, type BuyerFormState } from './actions'
import type { BuyerRow } from '@/lib/queries/buyers'

const INITIAL: BuyerFormState = {}

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
  initial?: BuyerRow | null
  onSuccess: () => void
}

export default function BuyerForm({ mode, initial, onSuccess }: Props) {
  const action = mode === 'create' ? createBuyerAction : updateBuyerAction
  const [state, formAction] = useFormState(action, INITIAL)

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="계약자번호" required>
          <TextInput name="buyer_no" required defaultValue={initial?.buyer_no ?? ''} />
        </Field>
        <Field label="개인/법인" required>
          <Select name="buyer_type" required defaultValue={initial?.buyer_type ?? '개인'}>
            <option value="개인">개인</option>
            <option value="법인">법인</option>
          </Select>
        </Field>
        <div />

        <Field label="계약자명1" required>
          <TextInput name="name1" required defaultValue={initial?.name1 ?? ''} />
        </Field>
        <Field label="계약자명2">
          <TextInput name="name2" defaultValue={initial?.name2 ?? ''} />
        </Field>
        <div />

        <Field label="휴대폰1">
          <TextInput name="phone1" defaultValue={initial?.phone1 ?? ''} />
        </Field>
        <Field label="휴대폰2">
          <TextInput name="phone2" defaultValue={initial?.phone2 ?? ''} />
        </Field>
        <div />

        <Field label="일반전화1">
          <TextInput name="tel1" defaultValue={initial?.tel1 ?? ''} />
        </Field>
        <Field label="일반전화2">
          <TextInput name="tel2" defaultValue={initial?.tel2 ?? ''} />
        </Field>
        <div />

        <Field label="이메일1">
          <TextInput name="email1" type="email" defaultValue={initial?.email1 ?? ''} />
        </Field>
        <Field label="이메일2">
          <TextInput name="email2" type="email" defaultValue={initial?.email2 ?? ''} />
        </Field>
        <div />
      </div>

      <Field label="주소1">
        <TextInput name="address1" defaultValue={initial?.address1 ?? ''} />
      </Field>
      <Field label="주소2">
        <TextInput name="address2" defaultValue={initial?.address2 ?? ''} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="비고1">
          <TextArea name="memo1" rows={2} defaultValue={initial?.memo1 ?? ''} />
        </Field>
        <Field label="비고2">
          <TextArea name="memo2" rows={2} defaultValue={initial?.memo2 ?? ''} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">수신동의:</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_sms" defaultChecked={initial?.agree_sms ?? false} />
          문자
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_email" defaultChecked={initial?.agree_email ?? false} />
          이메일
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_post" defaultChecked={initial?.agree_post ?? false} />
          우편
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        ※ 주민번호는 보안상 별도 RPC 연동 후 입력 가능합니다 (Phase 10 후속 단계).
      </p>

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
