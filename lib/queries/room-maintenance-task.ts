// 객실정비(room_maintenance_tasks) CRUD.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CommonStatus, MaintenanceTypeEnum } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type TaskRow = Database['public']['Tables']['room_maintenance_tasks']['Row']
export type TaskInsert = Database['public']['Tables']['room_maintenance_tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['room_maintenance_tasks']['Update']

export const MAINTENANCE_TYPES: MaintenanceTypeEnum[] = [
  '청소',
  '수리',
  '비품교체',
  '도배장판',
  '설비',
  '기타',
]

export type TaskFilter = {
  phase?: number | null
  roomNo?: string | null
  status?: CommonStatus | null
  statusNot?: CommonStatus | null
  type?: MaintenanceTypeEnum | null
  requester?: string | null
  from?: string | null
  to?: string | null
}

export const listTasks = async (supabase: Sb, filter: TaskFilter = {}): Promise<TaskRow[]> => {
  let query = supabase
    .from('room_maintenance_tasks')
    .select('*')
    .order('request_date', { ascending: false })
    .limit(500)

  if (filter.phase != null) query = query.eq('phase', filter.phase)
  if (filter.roomNo) query = query.ilike('room_no', `%${filter.roomNo}%`)
  if (filter.status)    query = query.eq('status', filter.status)
  if (filter.statusNot) query = query.neq('status', filter.statusNot)
  if (filter.type) query = query.eq('maintenance_type', filter.type)
  if (filter.requester) query = query.ilike('requester', `%${filter.requester}%`)
  if (filter.from) query = query.gte('request_date', filter.from)
  if (filter.to) query = query.lte('request_date', filter.to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as TaskRow[]
}

export const createTask = async (supabase: Sb, payload: TaskInsert): Promise<TaskRow> => {
  const { data, error } = await supabase
    .from('room_maintenance_tasks')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TaskRow
}

export const updateTask = async (
  supabase: Sb,
  id: string,
  payload: TaskUpdate,
): Promise<TaskRow> => {
  const { data, error } = await supabase
    .from('room_maintenance_tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TaskRow
}

export const deleteTask = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('room_maintenance_tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
