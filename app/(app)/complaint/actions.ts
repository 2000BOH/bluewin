'use server'

// 민원접수 서버 액션.
// - maintenance_requests 에 source='complaint' 로 레코드를 생성한다.
// - 숙박형태 기반으로 R&R 담당자 번호를 자동 배분 (rnr_mapping.stay_types 기반).
// - 상태는 기본 '접수' → /maintenance/inbox (접수현황) 에 노출된다.

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { todayKst } from '@/lib/utils/format'
import { loadRnrRules } from '@/lib/queries/rnr'
import { assignRnrByStayType } from '@/lib/utils/rnr'
import type { StayType } from '@/types/status'
import type { CommonStatus, MaintenanceSourceEnum } from '@/types/supabase'

export type ComplaintFormState = {
  error?: string
  ok?: boolean
  // UI 안내용: 자동 배분된 담당자 번호 (없으면 미배분).
  assignedRnrNo?: string | null
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

const parsePhase = (v: FormDataEntryValue | null): number => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) throw new Error('차수는 1 이상의 숫자여야 합니다.')
  return n
}

export async function createComplaintAction(
  _prev: ComplaintFormState,
  form: FormData,
): Promise<ComplaintFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()

    const phase = parsePhase(form.get('phase'))
    const room_no = required(form.get('room_no'), '호수')
    const title = required(form.get('title'), '민원제목')
    const content = optional(form.get('content'))
    const requester = required(form.get('requester'), '요청자')
    const stay_type = optional(form.get('stay_type')) as StayType | null

    // R&R 자동 배분: DB 규칙 조회 후 숙박형태 매칭.
    const rules = await loadRnrRules(supabase)
    const rnr_no = assignRnrByStayType(stay_type, rules)

    const { error } = await supabase.from('maintenance_requests').insert({
      phase,
      room_no,
      title: `[민원] ${title}`,
      content,
      requester,
      request_date: todayKst(),
      urgency: '일반',
      status: '접수' satisfies CommonStatus,
      source: 'complaint' satisfies MaintenanceSourceEnum,
      source_id: null,
      contract_id: null,
      stay_type,
      rnr_no,
      assigned_to: null,
      action_content: null,
      completed_at: null,
      completed_by: null,
      creator: user.id,
      updater: user.id,
    })
    if (error) return { error: error.message }

    revalidatePath('/complaint')
    revalidatePath('/maintenance/inbox')
    if (rnr_no) revalidatePath(`/rnr/${rnr_no}`)
    return { ok: true, assignedRnrNo: rnr_no ?? null }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
