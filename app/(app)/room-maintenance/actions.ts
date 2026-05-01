'use server'

// 객실정비 서버 액션 — maintenance_requests 를 처리상태='청소' 로 관리.

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  type MaintenanceInsert,
  type MaintenanceUpdate,
} from '@/lib/queries/maintenance'
import type { CommonStatus } from '@/types/supabase'
import { todayKst } from '@/lib/utils/format'

export type TaskFormState = { error?: string; ok?: boolean }

const parsePhase = (v: FormDataEntryValue | null): number => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) throw new Error('차수는 1 이상의 숫자여야 합니다.')
  return n
}
const required = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim()
  if (!s) throw new Error(`${name} 필수입니다.`)
  return s
}
const optional = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim(); return s || null
}

const buildPayload = (form: FormData) => ({
  phase:          parsePhase(form.get('phase')),
  room_no:        required(form.get('room_no'), '호수'),
  title:          required(form.get('title'), '제목'),
  status:         (required(form.get('status'), '처리상태') as CommonStatus),
  urgency:        ((form.get('urgency') as import('@/types/supabase').UrgencyLevel) || '일반'),
  content:        optional(form.get('content')),
  requester:      optional(form.get('requester')),
  request_date:   optional(form.get('request_date')) ?? todayKst(),
  assigned_to:    optional(form.get('assigned_to')),
  action_content: optional(form.get('action_content')),
})

const revalidate = () => {
  revalidatePath('/room-maintenance')
  revalidatePath('/maintenance/inbox')
}

export async function createTaskAction(
  _prev: TaskFormState,
  form: FormData,
): Promise<TaskFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const base = buildPayload(form)
    const payload: MaintenanceInsert = {
      ...base,
      status: base.status || '청소',
      source: '직접입력',
      source_id: null,
      contract_id: null,
      stay_type: null,
      rnr_no: null,
      completed_at: base.status === '완료' ? new Date().toISOString() : null,
      completed_by: base.status === '완료' ? user.id : null,
      creator: user.id,
      updater: user.id,
    }
    await createMaintenance(supabase, payload)
    revalidate()
    return { ok: true }
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
    const base = buildPayload(form)
    const payload: MaintenanceUpdate = {
      ...base,
      updater: user.id,
      completed_at: base.status === '완료' ? new Date().toISOString() : null,
      completed_by: base.status === '완료' ? user.id : null,
    }
    await updateMaintenance(supabase, id, payload)
    revalidate()
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteTaskAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteMaintenance(supabase, id)
  revalidate()
}

export async function updateTaskStatusAction(
  id: string,
  status: CommonStatus,
): Promise<{ ok: true } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!id) return { error: 'id 누락' }
    const supabase = createServerSupabase()
    await updateMaintenance(supabase, id, {
      status,
      updater: user.id,
      completed_at: status === '완료' ? new Date().toISOString() : null,
      completed_by: status === '완료' ? user.id : null,
    })
    revalidatePath('/room-maintenance')
    revalidatePath('/maintenance/inbox')
    revalidatePath('/maintenance')
    revalidatePath('/room-check')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

