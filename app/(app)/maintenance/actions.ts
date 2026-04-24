'use server'

// 영선 관리 서버 액션. createMaintenance / updateMaintenance / deleteMaintenance 를 form 에서 호출.

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
import type { CommonStatus, UrgencyLevel } from '@/types/supabase'
import { todayKst } from '@/lib/utils/format'

export type MaintenanceFormState = { error?: string; ok?: boolean }

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
  const s = String(v ?? '').trim()
  return s ? s : null
}

const buildPayload = (form: FormData) => {
  const phase = parsePhase(form.get('phase'))
  const room_no = required(form.get('room_no'), '호수')
  const title = required(form.get('title'), '제목')
  const status = required(form.get('status'), '상태') as CommonStatus
  const urgency = (form.get('urgency') as UrgencyLevel) || '일반'

  return {
    phase,
    room_no,
    title,
    status,
    urgency,
    content: optional(form.get('content')),
    requester: optional(form.get('requester')),
    request_date: optional(form.get('request_date')) ?? todayKst(),
    assigned_to: optional(form.get('assigned_to')),
    action_content: optional(form.get('action_content')),
  }
}

export async function createMaintenanceAction(
  _prev: MaintenanceFormState,
  form: FormData,
): Promise<MaintenanceFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const payload: MaintenanceInsert = {
      ...buildPayload(form),
      source: '직접입력',
      source_id: null,
      contract_id: null,
      stay_type: null,
      rnr_no: null,
      completed_at: null,
      completed_by: null,
      creator: user.id,
      updater: user.id,
    }
    if (payload.status === '완료') {
      payload.completed_at = new Date().toISOString()
      payload.completed_by = user.id
    }
    await createMaintenance(supabase, payload)
    revalidatePath('/maintenance')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateMaintenanceAction(
  _prev: MaintenanceFormState,
  form: FormData,
): Promise<MaintenanceFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const payload: MaintenanceUpdate = {
      ...buildPayload(form),
      updater: user.id,
    }
    if (payload.status === '완료') {
      payload.completed_at = payload.completed_at ?? new Date().toISOString()
      payload.completed_by = payload.completed_by ?? user.id
    } else {
      payload.completed_at = null
      payload.completed_by = null
    }
    await updateMaintenance(supabase, id, payload)
    revalidatePath('/maintenance')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteMaintenanceAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteMaintenance(supabase, id)
  revalidatePath('/maintenance')
}
