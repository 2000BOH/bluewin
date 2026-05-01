'use server'

// 입주지원 서버 액션.

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

export type MoveInFormState = { error?: string; ok?: boolean }

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
  return s || null
}
const parsePhotos = (v: FormDataEntryValue | null): string[] => {
  try {
    const parsed = JSON.parse(String(v ?? ''))
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : []
  } catch { return [] }
}

const buildPayload = (form: FormData) => ({
  phase:          parsePhase(form.get('phase')),
  room_no:        required(form.get('room_no'), '호수'),
  title:          required(form.get('title'), '제목'),
  status:         (required(form.get('status'), '상태') as CommonStatus),
  urgency:        ((form.get('urgency') as UrgencyLevel) || '일반'),
  content:        optional(form.get('content')),
  requester:      optional(form.get('requester')),
  request_date:   optional(form.get('request_date')) ?? todayKst(),
  assigned_to:    optional(form.get('assigned_to')),
  action_content: optional(form.get('action_content')),
  photos:         parsePhotos(form.get('photos')),
})

const revalidate = () => {
  revalidatePath('/maintenance/move-in')
  revalidatePath('/maintenance/inbox')
}

export async function createMoveInAction(
  _prev: MoveInFormState,
  form: FormData,
): Promise<MoveInFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const base = buildPayload(form)
    const payload: MaintenanceInsert = {
      ...base,
      // 입주지원 신규 등록 시 상태 고정 + 담당자 자동 배정(01 유태형)
      status: base.status === '완료' ? '완료' : '입주지원',
      rnr_no: '01',
      source: '직접입력',
      source_id: null,
      contract_id: null,
      stay_type: null,
      completed_at: base.status === '완료' ? new Date().toISOString() : null,
      completed_by: base.status === '완료' ? user.id : null,
      creator: user.id,
      updater: user.id,
    }
    await createMaintenance(supabase, payload)
    revalidate()
    return { ok: true }
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('invalid input value for enum')) {
      return { error: 'DB 마이그레이션이 필요합니다. Supabase SQL 편집기에서: ALTER TYPE public.common_status ADD VALUE IF NOT EXISTS \'입주지원\' AFTER \'접수\';' }
    }
    return { error: msg }
  }
}

export async function updateMoveInAction(
  _prev: MoveInFormState,
  form: FormData,
): Promise<MoveInFormState> {
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
    const msg = (e as Error).message
    if (msg.includes('invalid input value for enum')) {
      return { error: 'DB 마이그레이션이 필요합니다. Supabase SQL 편집기에서: ALTER TYPE public.common_status ADD VALUE IF NOT EXISTS \'입주지원\' AFTER \'접수\';' }
    }
    return { error: msg }
  }
}

export async function deleteMoveInAction(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteMaintenance(supabase, id)
  revalidate()
}
