'use client'

// 영선 요청 등록/수정 폼.
// 모달 안에 들어가 사용된다. 부모는 onClose 호출로 닫고, 성공 시 자동 새로고침(revalidatePath).

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import {
  createMaintenanceAction,
  updateMaintenanceAction,
  type MaintenanceFormState,
} from './actions'
import { COMMON_STATUSES, URGENCY_LEVELS } from '@/types/status'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import { useRoomInput } from '@/hooks/useRoomInput'
import AutoRoomSummary from '@/components/common/AutoRoomSummary'

const INITIAL: MaintenanceFormState = {}

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
  initial?: MaintenanceRow | null
  onSuccess: () => void
}

export default function MaintenanceForm({ mode, initial, onSuccess }: Props) {
  const action = mode === 'create' ? createMaintenanceAction : updateMaintenanceAction
  const [state, formAction] = useFormState(action, INITIAL)

  const {
    phase,
    roomNo,
    roomNoRef,
    handlePhaseChange,
    handleRoomNoChange,
    handleRoomCompositionStart,
    handleRoomCompositionEnd,
  } = useRoomInput({
    initialPhase: initial?.phase ?? '',
    initialRoomNo: initial?.room_no ?? '',
  })

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === 'edit' && initial && (
        <input type="hidden" name="id" value={initial.id} />
      )}

      <Field label="차수" required>
        <TextInput
          name="phase"
          type="number"
          min={1}
          required
          value={phase}
          onChange={handlePhaseChange}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <Field label="호수" required>
          <TextInput
            ref={roomNoRef}
            name="room_no"
            required
            value={roomNo}
            onChange={handleRoomNoChange}
            onCompositionStart={handleRoomCompositionStart}
            onCompositionEnd={handleRoomCompositionEnd}
          />
        </Field>
      </div>

      <div className="sm:col-span-2 -mt-2 mb-2">
        <AutoRoomSummary phase={phase} roomNo={roomNo} />
      </div>

      <Field label="제목" required className="sm:col-span-2">
        <TextInput name="title" required defaultValue={initial?.title ?? ''} />
      </Field>

      <Field label="내용" className="sm:col-span-2">
        <TextArea name="content" defaultValue={initial?.content ?? ''} />
      </Field>

      <Field label="요청자">
        <TextInput name="requester" defaultValue={initial?.requester ?? ''} />
      </Field>

      <Field label="요청일">
        <TextInput name="request_date" type="date" defaultValue={initial?.request_date ?? ''} />
      </Field>

      <Field label="긴급도">
        <Select name="urgency" defaultValue={initial?.urgency ?? '일반'}>
          {URGENCY_LEVELS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="상태" required>
        <Select name="status" defaultValue={initial?.status ?? '접수'} required>
          {COMMON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="담당자" className="sm:col-span-2">
        <TextInput name="assigned_to" defaultValue={initial?.assigned_to ?? ''} />
      </Field>

      <Field label="처리내용" hint="완료 시 입력" className="sm:col-span-2">
        <TextArea name="action_content" defaultValue={initial?.action_content ?? ''} />
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
