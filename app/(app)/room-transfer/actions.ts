'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createTransfer,
  updateTransfer,
  deleteTransfer,
  type TransferInsert,
  type TransferUpdate,
} from '@/lib/queries/room-transfer'
import { ensureMaintenanceFromSource, ensureCleaningTaskFromSource, ensureCheckFromSource } from '@/lib/queries/maintenance-link'
import { isMaintenanceTriggerStatus, isCleaningTriggerStatus, isCheckOutTriggerStatus } from '@/lib/utils/status'
import type { CommonStatus } from '@/types/supabase'
import { todayKst } from '@/lib/utils/format'

export type TransferFormState = {
  error?: string
  ok?: boolean
  // 영선 자동 등록 시, 클라이언트에 안내 다이얼로그 표시용.
  maintenanceCreated?: { maintenance_id: string }
}

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

const buildPayload = (form: FormData) => {
  const status = required(form.get('status'), '상태') as CommonStatus
  return {
    from_phase: numReq(form.get('from_phase'), '이동 전 차수'),
    from_room_no: required(form.get('from_room_no'), '이동 전 호수'),
    to_phase: numReq(form.get('to_phase'), '이동 후 차수'),
    to_room_no: required(form.get('to_room_no'), '이동 후 호수'),
    tenant_name: optional(form.get('tenant_name')),
    tenant_phone: optional(form.get('tenant_phone')),
    transfer_date: optional(form.get('transfer_date')) ?? todayKst(),
    reason: optional(form.get('reason')),
    note: optional(form.get('note')),
    status,
  }
}

const linkIfNeeded = async (
  recordId: string,
  data: ReturnType<typeof buildPayload>,
  creator: string,
): Promise<{ maintenance_id: string } | undefined> => {
  const supabase = createServerSupabase()
  const summary = `${data.from_phase}차 ${data.from_room_no} → ${data.to_phase}차 ${data.to_room_no}`
  const detail = data.reason ?? summary
  const linkInput = {
    phase: data.to_phase,
    room_no: data.to_room_no,
    source: 'room-transfer' as const,
    source_id: recordId,
    requester: data.tenant_name ?? '시스템',
    summary,
    detail,
    creator,
  }
  if (isMaintenanceTriggerStatus(data.status)) {
    const { id } = await ensureMaintenanceFromSource(supabase, linkInput)
    return { maintenance_id: id }
  }
  if (isCleaningTriggerStatus(data.status)) {
    await ensureCleaningTaskFromSource(supabase, linkInput)
  }
  if (isCheckOutTriggerStatus(data.status)) {
    await ensureCheckFromSource(supabase, linkInput)
  }
  return undefined
}

export async function createTransferAction(
  _prev: TransferFormState,
  form: FormData,
): Promise<TransferFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: TransferInsert = { ...data, creator: user.id, updater: user.id }
    const row = await createTransfer(supabase, payload)
    const link = await linkIfNeeded(row.id, data, user.id)
    revalidatePath('/room-transfer')
    revalidatePath('/maintenance')
    revalidatePath('/room-maintenance')
    revalidatePath('/room-check')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateTransferAction(
  _prev: TransferFormState,
  form: FormData,
): Promise<TransferFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: TransferUpdate = { ...data, updater: user.id }
    await updateTransfer(supabase, id, payload)
    const link = await linkIfNeeded(id, data, user.id)
    revalidatePath('/room-transfer')
    revalidatePath('/maintenance')
    revalidatePath('/room-maintenance')
    revalidatePath('/room-check')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteTransferAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteTransfer(supabase, id)
  revalidatePath('/room-transfer')
}

// 목록에서 상태 배지를 클릭해 인라인으로 상태만 변경.
// 영선→영선, 청소→객실정비, 퇴실→객실체크 자동 등록.
export async function updateTransferStatusAction(
  id: string,
  status: CommonStatus,
): Promise<{ ok: true } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!id) return { error: 'id 누락' }
    const supabase = createServerSupabase()

    const payload: TransferUpdate = { status, updater: user.id }
    await updateTransfer(supabase, id, payload)

    if (isMaintenanceTriggerStatus(status) || isCleaningTriggerStatus(status) || isCheckOutTriggerStatus(status)) {
      const { data: row, error: fetchErr } = await supabase
        .from('room_transfers')
        .select('from_phase, from_room_no, to_phase, to_room_no, tenant_name, reason')
        .eq('id', id)
        .single()
      if (!fetchErr && row) {
        const summary = `${row.from_phase}차 ${row.from_room_no} → ${row.to_phase}차 ${row.to_room_no}`
        const linkInput = {
          phase: row.to_phase,
          room_no: row.to_room_no,
          source: 'room-transfer' as const,
          source_id: id,
          requester: row.tenant_name ?? '시스템',
          summary,
          detail: row.reason ?? summary,
          creator: user.id,
        }
        if (isMaintenanceTriggerStatus(status)) {
          await ensureMaintenanceFromSource(supabase, linkInput)
          revalidatePath('/maintenance')
        } else if (isCleaningTriggerStatus(status)) {
          await ensureCleaningTaskFromSource(supabase, linkInput)
          revalidatePath('/room-maintenance')
        } else {
          await ensureCheckFromSource(supabase, linkInput)
          revalidatePath('/room-check')
        }
      }
    }
    revalidatePath('/room-transfer')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
