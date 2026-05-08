'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import {
  createTransferAction,
  updateTransferAction,
  type TransferFormState,
} from './actions'
import { COMMON_STATUSES } from '@/types/status'
import type { TransferRow } from '@/lib/queries/room-transfer'
import RoomContractsPanel from '@/components/features/room/RoomContractsPanel'

const INITIAL: TransferFormState = {}

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
  initial?: TransferRow | null
  onSuccess: () => void
}

export default function TransferForm({ mode, initial, onSuccess }: Props) {
  const router = useRouter()
  const action = mode === 'create' ? createTransferAction : updateTransferAction
  const [state, formAction] = useFormState(action, INITIAL)

  // 계약서 패널 표시용 — 4개 입력을 controlled 로 추적.
  const [fromPhase, setFromPhase] = useState(
    initial?.from_phase != null ? String(initial.from_phase) : '',
  )
  const [fromRoomNo, setFromRoomNo] = useState(initial?.from_room_no ?? '')
  const [toPhase, setToPhase] = useState(
    initial?.to_phase != null ? String(initial.to_phase) : '',
  )
  const [toRoomNo, setToRoomNo] = useState(initial?.to_room_no ?? '')

  useEffect(() => {
    if (!state.ok) return
    // 영선 자동 등록된 경우 안내 후 이동 여부 확인.
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

      <Field label="이동 전 차수" required>
        <TextInput
          name="from_phase"
          type="number"
          min={1}
          required
          value={fromPhase}
          onChange={(e) => setFromPhase(e.target.value)}
        />
      </Field>
      <Field label="이동 전 호수" required>
        <TextInput
          name="from_room_no"
          required
          value={fromRoomNo}
          onChange={(e) => setFromRoomNo(e.target.value)}
        />
      </Field>
      <Field label="이동 후 차수" required>
        <TextInput
          name="to_phase"
          type="number"
          min={1}
          required
          value={toPhase}
          onChange={(e) => setToPhase(e.target.value)}
        />
      </Field>
      <Field label="이동 후 호수" required>
        <TextInput
          name="to_room_no"
          required
          value={toRoomNo}
          onChange={(e) => setToRoomNo(e.target.value)}
        />
      </Field>

      <Field label="임차인명">
        <TextInput name="tenant_name" defaultValue={initial?.tenant_name ?? ''} />
      </Field>
      <Field label="임차인 연락처">
        <TextInput name="tenant_phone" defaultValue={initial?.tenant_phone ?? ''} />
      </Field>

      <Field label="이동일">
        <TextInput
          name="transfer_date"
          type="date"
          defaultValue={initial?.transfer_date ?? ''}
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

      <Field label="이동 사유" className="sm:col-span-2">
        <TextArea name="reason" defaultValue={initial?.reason ?? ''} />
      </Field>
      <Field label="비고" className="sm:col-span-2">
        <TextArea name="note" defaultValue={initial?.note ?? ''} />
      </Field>

      <div className="sm:col-span-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RoomContractsPanel
          phase={fromPhase}
          roomNo={fromRoomNo}
          label="이동 전 객실 — 숙박계약서"
        />
        <RoomContractsPanel
          phase={toPhase}
          roomNo={toRoomNo}
          label="이동 후 객실 — 숙박계약서"
        />
      </div>

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
