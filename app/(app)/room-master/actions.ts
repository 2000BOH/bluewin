'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createRoom,
  updateRoom,
  deleteRoom,
  type RoomInsert,
  type RoomUpdate,
} from '@/lib/queries/rooms'
import { parseNumber } from '@/lib/utils/format'

export type RoomFormState = { error?: string; ok?: boolean }

const required = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim()
  if (!s) throw new Error(`${name} 필수입니다.`)
  return s
}
const optional = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}
const numReq = (v: FormDataEntryValue | null, name: string): number => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} 1 이상의 숫자여야 합니다.`)
  return n
}
const numOpt = (v: FormDataEntryValue | null): number | null =>
  parseNumber(String(v ?? ''))

const buildPayload = (form: FormData) => ({
  phase: numReq(form.get('phase'), '차수'),
  room_no: required(form.get('room_no'), '호수'),
  type: optional(form.get('type')),
  view_type: optional(form.get('view_type')),
  land_area: numOpt(form.get('land_area')),
  exclusive_area: numOpt(form.get('exclusive_area')),
  partial_common_area: numOpt(form.get('partial_common_area')),
  other_common_area: numOpt(form.get('other_common_area')),
  parking_common_area: numOpt(form.get('parking_common_area')),
  sale_area: numOpt(form.get('sale_area')),
  exclusive_ratio: numOpt(form.get('exclusive_ratio')),
  has_terrace: form.get('has_terrace') === 'on',
  has_attic: form.get('has_attic') === 'on',
  sale_price_excl_vat: numOpt(form.get('sale_price_excl_vat')),
  sale_price_incl_vat: numOpt(form.get('sale_price_incl_vat')),
})

export async function createRoomAction(
  _prev: RoomFormState,
  form: FormData,
): Promise<RoomFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const payload: RoomInsert = { ...buildPayload(form), creator: user.id, updater: user.id }
    await createRoom(supabase, payload)
    revalidatePath('/room-master')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateRoomAction(
  _prev: RoomFormState,
  form: FormData,
): Promise<RoomFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const payload: RoomUpdate = { ...buildPayload(form), updater: user.id }
    await updateRoom(supabase, id, payload)
    revalidatePath('/room-master')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteRoomAction(form: FormData): Promise<void> {
  const user = await getCurrentAppUser()
  if (!user) return
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteRoom(supabase, id)
  revalidatePath('/room-master')
}
