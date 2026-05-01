// 객실이동(room_transfers) CRUD.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CommonStatus } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type TransferRow = Database['public']['Tables']['room_transfers']['Row']
export type TransferInsert = Database['public']['Tables']['room_transfers']['Insert']
export type TransferUpdate = Database['public']['Tables']['room_transfers']['Update']

export type TransferFilter = {
  fromPhase?: number | null
  toPhase?: number | null
  roomNo?: string | null
  status?: CommonStatus | null
  statusNot?: CommonStatus | null
  statusNotIn?: CommonStatus[]
  tenantName?: string | null
  from?: string | null
  to?: string | null
}

export const listTransfers = async (
  supabase: Sb,
  filter: TransferFilter = {},
): Promise<TransferRow[]> => {
  let query = supabase
    .from('room_transfers')
    .select('*')
    .order('transfer_date', { ascending: false })
    .limit(500)

  if (filter.fromPhase != null) query = query.eq('from_phase', filter.fromPhase)
  if (filter.toPhase != null) query = query.eq('to_phase', filter.toPhase)
  if (filter.status)    query = query.eq('status', filter.status)
  if (filter.statusNot) query = query.neq('status', filter.statusNot)
  if (filter.statusNotIn?.length) {
    query = query.not('status', 'in', `(${filter.statusNotIn.join(',')})`)
  }
  if (filter.tenantName) query = query.ilike('tenant_name', `%${filter.tenantName}%`)
  if (filter.roomNo) {
    query = query.or(`from_room_no.ilike.%${filter.roomNo}%,to_room_no.ilike.%${filter.roomNo}%`)
  }
  if (filter.from) query = query.gte('transfer_date', filter.from)
  if (filter.to) query = query.lte('transfer_date', filter.to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as TransferRow[]
}

export const createTransfer = async (
  supabase: Sb,
  payload: TransferInsert,
): Promise<TransferRow> => {
  const { data, error } = await supabase
    .from('room_transfers')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TransferRow
}

export const updateTransfer = async (
  supabase: Sb,
  id: string,
  payload: TransferUpdate,
): Promise<TransferRow> => {
  const { data, error } = await supabase
    .from('room_transfers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as TransferRow
}

export const deleteTransfer = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('room_transfers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
