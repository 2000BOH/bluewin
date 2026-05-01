// 영선 요청(maintenance_requests) CRUD 쿼리.
// 서버 컴포넌트/액션에서 호출. 모든 함수가 supabase 인스턴스를 인자로 받는다.

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  CommonStatus,
  UrgencyLevel,
  RnrStaffNoEnum,
  MaintenanceSourceEnum,
} from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type MaintenanceRow = Database['public']['Tables']['maintenance_requests']['Row']
export type MaintenanceInsert = Database['public']['Tables']['maintenance_requests']['Insert']
export type MaintenanceUpdate = Database['public']['Tables']['maintenance_requests']['Update']

export type MaintenanceFilter = {
  phase?: number | null
  roomNo?: string | null
  status?: CommonStatus | null
  statusNot?: CommonStatus | null
  urgency?: UrgencyLevel | null
  assignedTo?: string | null
  requester?: string | null
  from?: string | null
  to?: string | null
  q?: string | null
  stayType?: string | null
  rnrNo?: RnrStaffNoEnum | null
  source?: MaintenanceSourceEnum | null
}

export const listMaintenance = async (
  supabase: Sb,
  filter: MaintenanceFilter = {},
): Promise<MaintenanceRow[]> => {
  let query = supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filter.phase != null) query = query.eq('phase', filter.phase)
  if (filter.roomNo) query = query.ilike('room_no', `%${filter.roomNo}%`)
  // status::text 캐스팅 — DB enum에 아직 없는 신규 값(입주지원 등)도 안전하게 필터링
  if (filter.status) query = query.filter('status::text', 'eq', filter.status)
  if (filter.statusNot) query = query.filter('status::text', 'neq', filter.statusNot)
  if (filter.urgency) query = query.eq('urgency', filter.urgency)
  if (filter.assignedTo) query = query.ilike('assigned_to', `%${filter.assignedTo}%`)
  if (filter.requester)  query = query.ilike('requester',   `%${filter.requester}%`)
  if (filter.from) query = query.gte('request_date', filter.from)
  if (filter.to) query = query.lte('request_date', filter.to)
  if (filter.q) query = query.or(`title.ilike.%${filter.q}%,content.ilike.%${filter.q}%`)
  if (filter.stayType) query = query.eq('stay_type', filter.stayType)
  if (filter.rnrNo) query = query.eq('rnr_no', filter.rnrNo)
  if (filter.source) query = query.eq('source', filter.source)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as MaintenanceRow[]
}

export const getMaintenance = async (
  supabase: Sb,
  id: string,
): Promise<MaintenanceRow | null> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as MaintenanceRow | null
}

export const createMaintenance = async (
  supabase: Sb,
  payload: MaintenanceInsert,
): Promise<MaintenanceRow> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as MaintenanceRow
}

export const updateMaintenance = async (
  supabase: Sb,
  id: string,
  payload: MaintenanceUpdate,
): Promise<MaintenanceRow> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as MaintenanceRow
}

export const deleteMaintenance = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// DB enum에 '입주지원'이 아직 없는 경우: JS 측에서 필터링.
// '완료'는 기존 enum에 있으므로 DB 필터 사용, '입주지원'만 JS 필터.
export const listMoveIn = async (
  supabase: Sb,
  filter: { statusValue?: string; requester?: string | null; from?: string | null; to?: string | null } = {},
): Promise<MaintenanceRow[]> => {
  const wantStatus = filter.statusValue ?? '입주지원'

  // '완료'는 기존 enum 값이므로 DB 레벨에서 필터 가능
  if (wantStatus === '완료') {
    let q = supabase
      .from('maintenance_requests')
      .select('*')
      .eq('status', '완료')
      .order('created_at', { ascending: false })
      .limit(500)
    if (filter.requester) q = q.ilike('requester', `%${filter.requester}%`)
    if (filter.from) q = q.gte('request_date', filter.from)
    if (filter.to) q = q.lte('request_date', filter.to)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as MaintenanceRow[]
  }

  // '입주지원' 등 미등록 enum 값: 전체 조회 후 JS 필터
  let q = supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)
  if (filter.requester) q = q.ilike('requester', `%${filter.requester}%`)
  if (filter.from) q = q.gte('request_date', filter.from)
  if (filter.to) q = q.lte('request_date', filter.to)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return ((data ?? []) as MaintenanceRow[]).filter(
    (r) => (r.status as string) === wantStatus,
  )
}
