'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createCheck,
  updateCheck,
  deleteCheck,
  normalizeChecklist,
  CHECKLIST_ITEMS,
  type CheckInsert,
  type CheckUpdate,
} from '@/lib/queries/room-check'
import { ensureMaintenanceFromSource } from '@/lib/queries/maintenance-link'
import { isMaintenanceTriggerStatus } from '@/lib/utils/status'
import type { CommonStatus, OverallCheckStatus } from '@/types/supabase'
import { todayKst } from '@/lib/utils/format'

export type CheckFormState = {
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
  const checklistInput: Record<string, string> = {}
  for (const { key } of CHECKLIST_ITEMS) {
    checklistInput[key] = String(form.get(`checklist.${key}`) ?? '해당없음')
  }
  return {
    phase: numReq(form.get('phase'), '차수'),
    room_no: required(form.get('room_no'), '호수'),
    check_date: optional(form.get('check_date')) ?? todayKst(),
    checker: optional(form.get('checker')),
    checklist: normalizeChecklist(checklistInput),
    overall_status: (required(form.get('overall_status'), '전체상태') as OverallCheckStatus),
    special_notes: optional(form.get('special_notes')),
    next_check_date: optional(form.get('next_check_date')),
    status: required(form.get('status'), '상태') as CommonStatus,
  }
}

const linkMaintenanceIfNeeded = async (
  recordId: string,
  data: ReturnType<typeof buildPayload>,
  creator: string,
) => {
  if (!isMaintenanceTriggerStatus(data.status)) return undefined
  const supabase = createServerSupabase()
  const summary = `${data.phase}차 ${data.room_no} 체크 결과: ${data.overall_status}`
  const detail = data.special_notes ?? summary
  const { id } = await ensureMaintenanceFromSource(supabase, {
    phase: data.phase,
    room_no: data.room_no,
    source: 'room-check',
    source_id: recordId,
    requester: data.checker ?? '점검자',
    summary,
    detail,
    creator,
  })
  return { maintenance_id: id }
}

export async function createCheckAction(
  _prev: CheckFormState,
  form: FormData,
): Promise<CheckFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: CheckInsert = {
      ...data,
      contract_id: null,
      photos: [],
      creator: user.id,
      updater: user.id,
    }
    const row = await createCheck(supabase, payload)
    const link = await linkMaintenanceIfNeeded(row.id, data, user.id)
    revalidatePath('/room-check')
    if (link) revalidatePath('/maintenance')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateCheckAction(
  _prev: CheckFormState,
  form: FormData,
): Promise<CheckFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const data = buildPayload(form)
    const payload: CheckUpdate = { ...data, updater: user.id }
    await updateCheck(supabase, id, payload)
    const link = await linkMaintenanceIfNeeded(id, data, user.id)
    revalidatePath('/room-check')
    if (link) revalidatePath('/maintenance')
    return { ok: true, maintenanceCreated: link }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteCheckAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteCheck(supabase, id)
  revalidatePath('/room-check')
}
