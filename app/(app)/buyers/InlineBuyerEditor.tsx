'use client'

// 수분양자(소유주) 인라인 수정 폼.
// 행 펼치기 영역에서 표시되어, "수정" 버튼으로 현재 데이터를 그대로 편집·저장한다.
// 주민번호(ssn1/ssn2)는 보안상 별도 RPC 처리 — 본 폼은 입력 무시.

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput, TextArea, Select } from '@/components/common/FormField'
import { updateBuyerAction, type BuyerFormState } from './actions'
import type { BuyerRow } from '@/lib/queries/buyers'

const INITIAL: BuyerFormState = {}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '저장 중...' : '수정'}
    </Button>
  )
}

type Props = {
  row: BuyerRow
  onClose: () => void
  onSaved: () => void
}

export default function InlineBuyerEditor({ row, onClose, onSaved }: Props) {
  const [state, formAction] = useFormState(updateBuyerAction, INITIAL)

  useEffect(() => {
    if (state.ok) onSaved()
  }, [state, onSaved])

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={row.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="계약자번호" required>
          <TextInput name="buyer_no" required defaultValue={row.buyer_no ?? ''} />
        </Field>
        <Field label="개인/법인" required>
          <Select name="buyer_type" required defaultValue={row.buyer_type ?? '개인'}>
            <option value="개인">개인</option>
            <option value="법인">법인</option>
          </Select>
        </Field>
        <div />

        <Field label="계약자명1" required>
          <TextInput name="name1" required defaultValue={row.name1 ?? ''} />
        </Field>
        <Field label="계약자명2">
          <TextInput name="name2" defaultValue={row.name2 ?? ''} />
        </Field>
        <div />

        <Field label="휴대폰1">
          <TextInput name="phone1" defaultValue={row.phone1 ?? ''} />
        </Field>
        <Field label="휴대폰2">
          <TextInput name="phone2" defaultValue={row.phone2 ?? ''} />
        </Field>
        <div />

        <Field label="일반전화1">
          <TextInput name="tel1" defaultValue={row.tel1 ?? ''} />
        </Field>
        <Field label="일반전화2">
          <TextInput name="tel2" defaultValue={row.tel2 ?? ''} />
        </Field>
        <div />

        <Field label="이메일1">
          <TextInput name="email1" type="email" defaultValue={row.email1 ?? ''} />
        </Field>
        <Field label="이메일2">
          <TextInput name="email2" type="email" defaultValue={row.email2 ?? ''} />
        </Field>
        <div />
      </div>

      <Field label="주소1">
        <TextInput name="address1" defaultValue={row.address1 ?? ''} />
      </Field>
      <Field label="주소2">
        <TextInput name="address2" defaultValue={row.address2 ?? ''} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="비고1">
          <TextArea name="memo1" rows={2} defaultValue={row.memo1 ?? ''} />
        </Field>
        <Field label="비고2">
          <TextArea name="memo2" rows={2} defaultValue={row.memo2 ?? ''} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">수신동의:</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_sms" defaultChecked={row.agree_sms ?? false} />
          문자
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_email" defaultChecked={row.agree_email ?? false} />
          이메일
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="agree_post" defaultChecked={row.agree_post ?? false} />
          우편
        </label>
      </div>

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
