'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import { createTaskAction, updateTaskAction, type TaskFormState } from './actions'
import { COMMON_STATUSES } from '@/types/status'
import { MAINTENANCE_TYPES, type TaskRow } from '@/lib/queries/room-maintenance-task'
import { formatCurrency } from '@/lib/utils/format'

const INITIAL: TaskFormState = {}

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
  initial?: TaskRow | null
  onSuccess: () => void
}

export default function TaskForm({ mode, initial, onSuccess }: Props) {
  const router = useRouter()
  const action = mode === 'create' ? createTaskAction : updateTaskAction
  const [state, formAction] = useFormState(action, INITIAL)

  useEffect(() => {
    if (!state.ok) return
    if (state.maintenanceCreated) {
      const go = confirm('상태가 "영선"으로 변경되어 영선 페이지에 자동 등록되었습니다.\n영선 페이지로 이동할까요?')
      if (go) {
        router.push('/maintenance')
        return
      }
    }
    onSuccess()
  }, [state, onSuccess, router])

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="차수" required>
        <TextInput name="phase" type="number" min={1} required defaultValue={initial?.phase ?? ''} />
      </Field>
      <Field label="호수" required>
        <TextInput name="room_no" required defaultValue={initial?.room_no ?? ''} />
      </Field>
      <Field label="정비유형" required>
        <Select name="maintenance_type" defaultValue={initial?.maintenance_type ?? '청소'} required>
          {MAINTENANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="요청일">
        <TextInput name="request_date" type="date" defaultValue={initial?.request_date ?? ''} />
      </Field>
      <Field label="요청자">
        <TextInput name="requester" defaultValue={initial?.requester ?? ''} />
      </Field>
      <Field label="담당자" hint="직원 이름 또는 외부업체명">
        <TextInput name="assigned_to" defaultValue={initial?.assigned_to ?? ''} />
      </Field>
      <Field label="비용" hint="원 단위, 천단위 콤마 자동">
        <TextInput
          name="cost"
          inputMode="numeric"
          defaultValue={initial?.cost != null ? formatCurrency(initial.cost) : ''}
          placeholder="0"
        />
      </Field>
      <Field label="상태" required hint="'영선' 선택 시 영선 페이지에 자동 등록">
        <Select name="status" defaultValue={initial?.status ?? '접수'} required>
          {COMMON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="정비 내용" className="sm:col-span-2">
        <TextArea name="content" defaultValue={initial?.content ?? ''} />
      </Field>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Submit label={mode === 'create' ? '등록' : '저장'} />
      </div>
    </form>
  )
}
