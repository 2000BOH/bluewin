// 영선 요청(maintenance_requests) CRUD 쿼리.
// 서버 컴포넌트/액션에서 호출. 모든 함수가 supabase 인스턴스를 인자로 받는다.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CommonStatus, UrgencyLevel } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type MaintenanceRow = Database['public']['Tables']['maintenance_requests']['Row']
export type MaintenanceInsert = Database['public']['Tables']['maintenance_requests']['Insert']
export type MaintenanceUpdate = Database['public']['Tables']['maintenance_requests']['Update']

export type MaintenanceFilter = {
  phase?: number | null
  roomNo?: string | null
  status?: CommonStatus | null
  urgency?: UrgencyLevel | null
  assignedTo?: string | null
  from?: string | null
  to?: string | null
  q?: string | null
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
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.urgency) query = query.eq('urgency', filter.urgency)
  if (filter.assignedTo) query = query.ilike('assigned_to', `%${filter.assignedTo}%`)
  if (filter.from) query = query.gte('request_date', filter.from)
  if (filter.to) query = query.lte('request_date', filter.to)
  if (filter.q) query = query.or(`title.ilike.%${filter.q}%,content.ilike.%${filter.q}%`)

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
