'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/common/FormField'
import { createRoomAction, updateRoomAction, type RoomFormState } from './actions'
import type { RoomRow } from '@/lib/queries/rooms'
import { useRoomInput } from '@/hooks/useRoomInput'
import AutoRoomSummary from '@/components/common/AutoRoomSummary'

const INITIAL: RoomFormState = {}

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
  initial?: RoomRow | null
  onSuccess: () => void
}

export default function RoomForm({ mode, initial, onSuccess }: Props) {
  const action = mode === 'create' ? createRoomAction : updateRoomAction
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
    initialPhase: String(initial?.phase ?? ''),
    initialRoomNo: initial?.room_no ?? '',
  })

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="차수" required>
        <TextInput name="phase" type="number" min={1} required value={phase} onChange={handlePhaseChange} />
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

      <div className="col-span-full -mt-2 mb-2">
        <AutoRoomSummary phase={phase} roomNo={roomNo} />
      </div>
      <Field label="타입">
        <TextInput name="type" defaultValue={initial?.type ?? ''} />
      </Field>
      <Field label="조망">
        <TextInput name="view_type" defaultValue={initial?.view_type ?? ''} />
      </Field>

      <Field label="대지면적">
        <TextInput name="land_area" inputMode="decimal" defaultValue={initial?.land_area ?? ''} />
      </Field>
      <Field label="전유면적">
        <TextInput name="exclusive_area" inputMode="decimal" defaultValue={initial?.exclusive_area ?? ''} />
      </Field>
      <Field label="일부공용">
        <TextInput name="partial_common_area" inputMode="decimal" defaultValue={initial?.partial_common_area ?? ''} />
      </Field>
      <Field label="기타공용">
        <TextInput name="other_common_area" inputMode="decimal" defaultValue={initial?.other_common_area ?? ''} />
      </Field>
      <Field label="주차장공용">
        <TextInput name="parking_common_area" inputMode="decimal" defaultValue={initial?.parking_common_area ?? ''} />
      </Field>
      <Field label="분양면적">
        <TextInput name="sale_area" inputMode="decimal" defaultValue={initial?.sale_area ?? ''} />
      </Field>
      <Field label="전유율 (%)">
        <TextInput name="exclusive_ratio" inputMode="decimal" defaultValue={initial?.exclusive_ratio ?? ''} />
      </Field>

      <Field label="분양금액 (VAT 제외)">
        <TextInput name="sale_price_excl_vat" inputMode="numeric" defaultValue={initial?.sale_price_excl_vat ?? ''} />
      </Field>
      <Field label="분양금액 (VAT 포함)">
        <TextInput name="sale_price_incl_vat" inputMode="numeric" defaultValue={initial?.sale_price_incl_vat ?? ''} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="has_terrace" defaultChecked={initial?.has_terrace ?? false} />
        테라스
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="has_attic" defaultChecked={initial?.has_attic ?? false} />
        다락
      </label>

      {state.error && (
        <p className="col-span-full text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="col-span-full flex justify-end gap-2 pt-2">
        <Submit label={mode === 'create' ? '등록' : '저장'} />
      </div>
    </form>
  )
}
