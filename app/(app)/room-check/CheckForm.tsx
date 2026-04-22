'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import {
  createCheckAction,
  updateCheckAction,
  type CheckFormState,
} from './actions'
import { COMMON_STATUSES } from '@/types/status'
import { CHECKLIST_ITEMS, type ChecklistMap } from '@/lib/queries/room-check'
import type { CheckRow } from '@/lib/queries/room-check'

const INITIAL: CheckFormState = {}
const ITEM_OPTS = ['정상', '불량', '해당없음'] as const
const OVERALL_OPTS = ['정상', '주의', '불량'] as const

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
  initial?: CheckRow | null
  onSuccess: () => void
}

export default function CheckForm({ mode, initial, onSuccess }: Props) {
  const router = useRouter()
  const action = mode === 'create' ? createCheckAction : updateCheckAction
  const [state, formAction] = useFormState(action, INITIAL)

  useEffect(() => {
    if (!state.ok) return
    if (state.maintenanceCreated) {
      const go = confirm('상태가 "영선반"으로 변경되어 영선 페이지에 자동 등록되었습니다.\n영선 페이지로 이동할까요?')
      if (go) {
        router.push('/maintenance')
        return
      }
    }
    onSuccess()
  }, [state, onSuccess, router])

  const checklist = (initial?.checklist ?? {}) as ChecklistMap

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="차수" required>
        <TextInput name="phase" type="number" min={1} required defaultValue={initial?.phase ?? ''} />
      </Field>
      <Field label="호수" required>
        <TextInput name="room_no" required defaultValue={initial?.room_no ?? ''} />
      </Field>
      <Field label="점검일">
        <TextInput name="check_date" type="date" defaultValue={initial?.check_date ?? ''} />
      </Field>
      <Field label="점검자">
        <TextInput name="checker" defaultValue={initial?.checker ?? ''} />
      </Field>

      <fieldset className="sm:col-span-2 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">체크리스트</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHECKLIST_ITEMS.map((it) => (
            <label key={it.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{it.label}</span>
              <select
                name={`checklist.${it.key}`}
                defaultValue={checklist[it.key] ?? '해당없음'}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {ITEM_OPTS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="전체 상태" required>
        <Select name="overall_status" defaultValue={initial?.overall_status ?? '정상'} required>
          {OVERALL_OPTS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="처리 상태" required hint="'영선반' 선택 시 영선 페이지에 자동 등록">
        <Select name="status" defaultValue={initial?.status ?? '접수'} required>
          {COMMON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="특이사항" className="sm:col-span-2">
        <TextArea name="special_notes" defaultValue={initial?.special_notes ?? ''} />
      </Field>
      <Field label="다음 점검 예정일">
        <TextInput name="next_check_date" type="date" defaultValue={initial?.next_check_date ?? ''} />
      </Field>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <p className="sm:col-span-2 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
        ※ 사진 업로드는 Phase 후속 작업에서 Supabase Storage 연동과 함께 추가됩니다.
      </p>

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Submit label={mode === 'create' ? '등록' : '저장'} />
      </div>
    </form>
  )
}
