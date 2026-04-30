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

const parsePhotos = (v: FormDataEntryValue | null): string[] => {
  const raw = String(v ?? '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0)
  } catch {
    return []
  }
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
    photos: parsePhotos(form.get('photos')),
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
    const { photos, ...rest } = data
    const payload: CheckInsert = {
      ...rest,
      contract_id: null,
      photos,
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
    const { photos, ...rest } = data
    const payload: CheckUpdate = { ...rest, photos, updater: user.id }
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

// 목록에서 상태 배지를 클릭해 인라인으로 상태만 변경.
// '영선' 으로 전환 시 영선 페이지 자동 등록.
export async function updateCheckStatusAction(
  id: string,
  status: CommonStatus,
): Promise<{ ok: true } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!id) return { error: 'id 누락' }
    const supabase = createServerSupabase()

    const payload: CheckUpdate = { status, updater: user.id }
    await updateCheck(supabase, id, payload)

    if (isMaintenanceTriggerStatus(status)) {
      const { data: row, error: fetchErr } = await supabase
        .from('room_checks')
        .select('phase, room_no, checker, overall_status, special_notes')
        .eq('id', id)
        .single()
      if (!fetchErr && row) {
        const summary = `${row.phase}차 ${row.room_no} 체크 결과: ${row.overall_status}`
        await ensureMaintenanceFromSource(supabase, {
          phase: row.phase,
          room_no: row.room_no,
          source: 'room-check',
          source_id: id,
          requester: row.checker ?? '점검자',
          summary,
          detail: row.special_notes ?? summary,
          creator: user.id,
        })
        revalidatePath('/maintenance')
      }
    }
    revalidatePath('/room-check')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// 객실체크 상세 체크리스트 저장. CheckTable 의 [상세] 모달에서 호출.
export type CheckDetailPayload = {
  id: string
  checklistJson: string
  okCount: number
  needCount: number
  moveInNotes: string | null
  contractNotes: string | null
  moveOutNotes: string | null
}

export async function saveCheckDetailAction(
  payload: CheckDetailPayload,
): Promise<{ ok: true } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!payload.id) return { error: 'id 누락' }

    let parsed: unknown
    try {
      parsed = JSON.parse(payload.checklistJson)
    } catch {
      return { error: '체크리스트 데이터 형식이 올바르지 않습니다.' }
    }
    if (!Array.isArray(parsed)) return { error: '체크리스트는 배열이어야 합니다.' }

    const supabase = createServerSupabase()
    await updateCheck(supabase, payload.id, {
      checklist_detail: parsed as unknown as CheckUpdate['checklist_detail'],
      ok_count: payload.okCount,
      need_count: payload.needCount,
      move_in_notes: payload.moveInNotes,
      contract_notes: payload.contractNotes,
      move_out_notes: payload.moveOutNotes,
      updater: user.id,
    })
    revalidatePath('/room-check')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
