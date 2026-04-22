// Phase 8: "영선반" 상태로 전환된 외부 페이지 레코드를 영선 페이지에 자동 등록.
// 동일 source/source_id 가 이미 존재하면 중복 등록을 막고 기존 레코드 id 를 반환.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MaintenanceSourceEnum } from '@/types/supabase'
import { buildMaintenanceAutoPayload } from '@/lib/utils/status'
import { todayKst } from '@/lib/utils/format'

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

// "영선반" 으로 전환 시 호출. 신규 등록한 maintenance_requests.id 또는 기존 id 를 반환.
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
      status: '영선반',
      assigned_to: null,
      action_content: null,
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
