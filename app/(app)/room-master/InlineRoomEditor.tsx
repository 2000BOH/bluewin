'use client'

// 객실마스터 인라인 수정 폼.
// 행 펼치기 영역에 표시되어, "수정" 버튼으로 현재 객실 정보를 그대로 편집·저장한다.

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/common/FormField'
import { updateRoomAction, type RoomFormState } from './actions'
import type { RoomRow } from '@/lib/queries/rooms'

const INITIAL: RoomFormState = {}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '저장 중...' : '수정'}
    </Button>
  )
}

type Props = {
  row: RoomRow
  onClose: () => void
  onSaved: () => void
}

export default function InlineRoomEditor({ row, onClose, onSaved }: Props) {
  const [state, formAction] = useFormState(updateRoomAction, INITIAL)

  useEffect(() => {
    if (state.ok) onSaved()
  }, [state, onSaved])

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={row.id} />
      {/* ① 기본정보 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">① 기본정보</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="차수" required>
            <TextInput name="phase" type="number" min={1} required defaultValue={row.phase ?? ''} />
          </Field>
          <Field label="호수" required>
            <TextInput name="room_no" required defaultValue={row.room_no ?? ''} />
          </Field>
          <Field label="타입">
            <TextInput name="type" defaultValue={row.type ?? ''} />
          </Field>
          <Field label="조망">
            <TextInput name="view_type" defaultValue={row.view_type ?? ''} />
          </Field>
        </div>
      </section>

      {/* ② 면적정보 */}
      <section className="rounded-md border bg-muted/30 p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">② 면적정보</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="대지면적">
            <TextInput name="land_area" inputMode="decimal" defaultValue={row.land_area ?? ''} />
          </Field>
          <Field label="전유면적">
            <TextInput name="exclusive_area" inputMode="decimal" defaultValue={row.exclusive_area ?? ''} />
          </Field>
          <Field label="일부공용">
            <TextInput name="partial_common_area" inputMode="decimal" defaultValue={row.partial_common_area ?? ''} />
          </Field>
          <Field label="기타공용">
            <TextInput name="other_common_area" inputMode="decimal" defaultValue={row.other_common_area ?? ''} />
          </Field>
          <Field label="주차공용">
            <TextInput name="parking_common_area" inputMode="decimal" defaultValue={row.parking_common_area ?? ''} />
          </Field>
          <Field label="분양면적">
            <TextInput name="sale_area" inputMode="decimal" defaultValue={row.sale_area ?? ''} />
          </Field>
          <Field label="전유율 (%)">
            <TextInput name="exclusive_ratio" inputMode="decimal" defaultValue={row.exclusive_ratio ?? ''} />
          </Field>
        </div>
      </section>

      {/* ③ 분양가 및 옵션 */}
      <section className="rounded-md border bg-background p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">③ 분양가 및 옵션</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Field label="VAT 제외">
            <TextInput name="sale_price_excl_vat" inputMode="numeric" defaultValue={row.sale_price_excl_vat ?? ''} />
          </Field>
          <Field label="VAT 포함">
            <TextInput name="sale_price_incl_vat" inputMode="numeric" defaultValue={row.sale_price_incl_vat ?? ''} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="has_terrace" defaultChecked={row.has_terrace ?? false} />
            테라스
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="has_attic" defaultChecked={row.has_attic ?? false} />
            다락
          </label>
        </div>
      </section>

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
