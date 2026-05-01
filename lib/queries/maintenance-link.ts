// Phase 8: 상태 전환 시 대상 테이블에 자동 등록.
// - "영선" 전환 → maintenance_requests (영선 페이지)
// - "청소" 전환 → room_maintenance_tasks (객실정비 페이지, 정비유형=청소)
// 동일 source/source_id 가 이미 존재하면 중복 등록을 막고 기존 레코드 id 를 반환.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MaintenanceSourceEnum } from '@/types/supabase'
import { buildMaintenanceAutoPayload } from '@/lib/utils/status'
import { todayKst } from '@/lib/utils/format'

// 빈 체크리스트 기본값 (8개 항목 모두 해당없음).
const DEFAULT_CHECKLIST = {
  cleanliness: '해당없음', amenities: '해당없음', damage: '해당없음',
  aircon: '해당없음', water: '해당없음', electric: '해당없음',
  doorlock: '해당없음', etc: '해당없음',
}

type Sb = SupabaseClient<Database>

type AutoLinkInput = {
  phase: number
  room_no: string
  source: Exclude<MaintenanceSourceEnum, '직접입력'>
  source_id: string
  requester: string
  summary: string
  detail?: string
  contract_id?: string | null
  creator: string
}

// "영선" 으로 전환 시 호출. 신규 등록한 maintenance_requests.id 또는 기존 id 를 반환.
export const ensureMaintenanceFromSource = async (
  supabase: Sb,
  input: AutoLinkInput,
): Promise<{ id: string; created: boolean }> => {
  // 동일 출처 기존 레코드 확인.
  const { data: existing, error: e1 } = await supabase
    .from('maintenance_requests')
    .select('id')
    .eq('source', input.source)
    .eq('source_id', input.source_id)
    .maybeSingle()
  if (e1) throw new Error(e1.message)
  if (existing) return { id: existing.id, created: false }

  const payload = buildMaintenanceAutoPayload({
    phase: input.phase,
    room_no: input.room_no,
    source: input.source,
    source_id: input.source_id,
    requester: input.requester,
    summary: input.summary,
    detail: input.detail,
  })

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert({
      ...payload,
      contract_id: input.contract_id ?? null,
      request_date: todayKst(),
      urgency: '일반',
      status: '영선',
      assigned_to: null,
      action_content: null,
      stay_type: null,
      rnr_no: null,
      completed_at: null,
      completed_by: null,
      creator: input.creator,
      updater: input.creator,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id, created: true }
}

type CleaningLinkInput = {
  phase: number
  room_no: string
  source: Exclude<MaintenanceSourceEnum, '직접입력'>
  source_id: string
  requester: string
  summary: string
  detail?: string
  contract_id?: string | null
  creator: string
}

// "청소" 상태로 전환 시 호출. room_maintenance_tasks 에 정비유형=청소로 자동 등록.
// 같은 차수/호수 + 오늘 날짜 + 청소 레코드가 이미 있으면 중복 생성 안 함.
export const ensureCleaningTaskFromSource = async (
  supabase: Sb,
  input: CleaningLinkInput,
): Promise<{ id: string; created: boolean }> => {
  const today = todayKst()

  const { data: existing, error: e1 } = await supabase
    .from('room_maintenance_tasks')
    .select('id')
    .eq('phase', input.phase)
    .eq('room_no', input.room_no)
    .eq('maintenance_type', '청소')
    .eq('request_date', today)
    .maybeSingle()
  if (e1) throw new Error(e1.message)
  if (existing) return { id: existing.id, created: false }

  const prefixMap: Record<Exclude<MaintenanceSourceEnum, '직접입력'>, string> = {
    complaint: '[민원]',
    'room-transfer': '[객실이동]',
    'room-check': '[객실체크]',
    'room-maintenance': '[객실정비]',
  }

  const { data, error } = await supabase
    .from('room_maintenance_tasks')
    .insert({
      phase: input.phase,
      room_no: input.room_no,
      maintenance_type: '청소',
      content: input.detail ?? `${prefixMap[input.source]} ${input.summary}`,
      requester: input.requester,
      request_date: today,
      assigned_to: null,
      status: '접수',
      cost: null,
      contract_id: input.contract_id ?? null,
      completed_at: null,
      completed_by: null,
      creator: input.creator,
      updater: input.creator,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id, created: true }
}

type CheckLinkInput = {
  phase: number
  room_no: string
  source: Exclude<MaintenanceSourceEnum, '직접입력'>
  source_id: string
  requester: string
  summary: string
  detail?: string
  contract_id?: string | null
  creator: string
}

// "퇴실" 상태로 전환 시 호출. room_checks 에 빈 체크리스트로 자동 등록.
// 같은 차수/호수 + 오늘 날짜 레코드가 이미 있으면 중복 생성 안 함.
export const ensureCheckFromSource = async (
  supabase: Sb,
  input: CheckLinkInput,
): Promise<{ id: string; created: boolean }> => {
  const today = todayKst()

  const { data: existing, error: e1 } = await supabase
    .from('room_checks')
    .select('id')
    .eq('phase', input.phase)
    .eq('room_no', input.room_no)
    .eq('check_date', today)
    .maybeSingle()
  if (e1) throw new Error(e1.message)
  if (existing) return { id: existing.id, created: false }

  const prefixMap: Record<Exclude<MaintenanceSourceEnum, '직접입력'>, string> = {
    complaint: '[민원]',
    'room-transfer': '[객실이동]',
    'room-check': '[객실체크]',
    'room-maintenance': '[객실정비]',
  }

  const { data, error } = await supabase
    .from('room_checks')
    .insert({
      phase: input.phase,
      room_no: input.room_no,
      check_date: today,
      checker: input.requester,
      checklist: DEFAULT_CHECKLIST,
      overall_status: '주의',
      special_notes: input.detail ?? `${prefixMap[input.source]} ${input.summary}`,
      photos: [],
      next_check_date: null,
      status: '접수',
      contract_id: input.contract_id ?? null,
      creator: input.creator,
      updater: input.creator,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id, created: true }
}
