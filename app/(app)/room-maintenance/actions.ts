'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createTask,
  updateTask,
  deleteTask,
  type TaskInsert,
  type TaskUpdate,
} from '@/lib/queries/room-maintenance-task'
import { ensureMaintenanceFromSource } from '@/lib/queries/maintenance-link'
import { isMaintenanceTriggerStatus } from '@/lib/utils/status'
import { parseNumber, todayKst } from '@/lib/utils/format'
import type { CommonStatus, MaintenanceTypeEnum } from '@/types/supabase'

export type TaskFormState = {
  error?: string
  ok?: boolean
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
    phase: numReq(form.get('phase'), '차수'),
    room_no: required(form.get('room_no'), '호수'),
    maintenance_type: required(form.get('maintenance_type'), '정비유형') as MaintenanceTypeEnum,
    content: optional(form.get('content')),
    requester: optional(form.get('requester')),
    request_date: optional(form.get('request_date')) ?? todayKst(),
    assigned_to: optional(form.get('assigned_to')),
    status,
    cost: parseNumber(String(form.get('cost') ?? '')),
  }
}

const linkMaintenanceIfNeeded = async (
  recordId: string,
  data: ReturnType<typeof buildPayload>,
  creator: string,
) => {
  if (!isMaintenanceTriggerStatus(data.status)) return undefined
  const supabase = createServerSupabase()
  const summary = `${data.phase}차 ${data.room_no} ${data.maintenance_type}`
  const detail = data.content ?? summary
  const { id } = await ensureMaintenanceFromSource(supabase, {
    phase: data.phase,
    room_no: data.room_no,
    source: 'room-maintenance',
    source_id: recordId,
    requester: data.requester ?? '시스템',
    summary,
    detail,
    creator,
  })
  return { maintenance_id: id }
}

export async function createTaskAction(
  _prev: TaskFormState,
  form: FormData,
): Promise<TaskFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: TaskInsert = {
      ...data,
      contract_id: null,
      completed_at: data.status === '완료' ? new Date().toISOString() : null,
      completed_by: data.status === '완료' ? user.id : null,
      creator: user.id,
      updater: user.id,
    }
    const row = await createTask(supabase, payload)
    const link = await linkMaintenanceIfNeeded(row.id, data, user.id)
    revalidatePath('/room-maintenance')
    if (link) revalidatePath('/maintenance')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateTaskAction(
  _prev: TaskFormState,
  form: FormData,
): Promise<TaskFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: TaskUpdate = {
      ...data,
      updater: user.id,
      completed_at: data.status === '완료' ? new Date().toISOString() : null,
      completed_by: data.status === '완료' ? user.id : null,
    }
    await updateTask(supabase, id, payload)
    const link = await linkMaintenanceIfNeeded(id, data, user.id)
    revalidatePath('/room-maintenance')
    if (link) revalidatePath('/maintenance')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteTaskAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteTask(supabase, id)
  revalidatePath('/room-maintenance')
}
