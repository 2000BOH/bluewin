'use client'

// 민원접수 폼. 저장 시 /maintenance/inbox 에 레코드가 자동 생성되고,
// 숙박형태에 해당하는 R&R 담당자 번호로 자동 배분된다.

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import { STAY_TYPES } from '@/types/status'
import { createComplaintAction, type ComplaintFormState } from './actions'

const INITIAL: ComplaintFormState = {}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? '접수 중...' : '민원 접수'}
    </button>
  )
}

export default function ComplaintForm() {
  const [state, formAction] = useFormState(createComplaintAction, INITIAL)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.ok) return
    const target = state.assignedRnrNo
    const msg = target
      ? `민원이 접수되었습니다. R&R 담당자 번호 ${target} 로 자동 배분되었습니다.`
      : '민원이 접수되었습니다. (자동 배분 대상 숙박형태가 없어 미배분 상태입니다.)'
    alert(msg)
    formRef.current?.reset()
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2"
    >
      <Field label="차수" required>
        <TextInput name="phase" type="number" min={1} required placeholder="예: 1" />
      </Field>
      <Field label="호수" required>
        <TextInput name="room_no" required placeholder="예: 301" />
      </Field>

      <Field label="요청자" required>
        <TextInput name="requester" required placeholder="임차인/연락받을 분" />
      </Field>
      <Field label="숙박형태" hint="R&R 담당자 자동 배분 근거">
        <Select name="stay_type" defaultValue="">
          <option value="">선택(미배분)</option>
          {STAY_TYPES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="민원 제목" required className="sm:col-span-2">
        <TextInput name="title" required placeholder="예: 에어컨 고장" />
      </Field>
      <Field label="민원 내용" className="sm:col-span-2">
        <TextArea name="content" rows={5} placeholder="상세 증상, 발생 시점 등" />
      </Field>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Submit />
      </div>
    </form>
  )
}
