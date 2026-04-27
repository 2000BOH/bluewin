// 객실마스터(rooms) CRUD.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type RoomRow = Database['public']['Tables']['rooms']['Row']
export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type RoomUpdate = Database['public']['Tables']['rooms']['Update']

export type RoomFilter = {
  phase?: number | null
  roomNo?: string | null
  type?: string | null
  contractForm?: string | null
  accommodationType?: string | null
  operationType?: string | null
}

export const listRooms = async (supabase: Sb, filter: RoomFilter = {}): Promise<RoomRow[]> => {
  let query = supabase
    .from('rooms')
    .select('*')
    .order('phase', { ascending: true })
    .order('room_no', { ascending: true })
    .limit(2000)

  if (filter.phase != null) query = query.eq('phase', filter.phase)
  if (filter.roomNo) query = query.ilike('room_no', `%${filter.roomNo}%`)
  if (filter.type) query = query.ilike('type', `%${filter.type}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  let rows = (data ?? []) as RoomRow[]

  // 계약형태/숙박형태/운영방식 필터는 contracts 조인 결과로 후처리.
  if (filter.contractForm || filter.accommodationType || filter.operationType) {
    let cQuery = supabase.from('contracts').select('phase, room_no')
    if (filter.contractForm) cQuery = cQuery.ilike('contract_form', `%${filter.contractForm}%`)
    if (filter.accommodationType)
      cQuery = cQuery.ilike('accommodation_type', `%${filter.accommodationType}%`)
    if (filter.operationType) cQuery = cQuery.ilike('operation_type', `%${filter.operationType}%`)
    const { data: cData } = await cQuery
    const allowed = new Set((cData ?? []).map((c) => `${c.phase}|${c.room_no}`))
    rows = rows.filter((r) => allowed.has(`${r.phase}|${r.room_no}`))
  }
  return rows
}

export const createRoom = async (supabase: Sb, payload: RoomInsert): Promise<RoomRow> => {
  const { data, error } = await supabase.from('rooms').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as RoomRow
}

export const updateRoom = async (
  supabase: Sb,
  id: string,
  payload: RoomUpdate,
): Promise<RoomRow> => {
  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as RoomRow
}

export const deleteRoom = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// 분양율, 분양면적 합계 등 Summary 에서도 재사용.
export const sumRoomTotals = (rows: RoomRow[]) => {
  const init = {
    land_area: 0,
    exclusive_area: 0,
    partial_common_area: 0,
    other_common_area: 0,
    parking_common_area: 0,
    sale_area: 0,
    sale_price_excl_vat: 0,
    sale_price_incl_vat: 0,
  }
  return rows.reduce((acc, r) => {
    acc.land_area += r.land_area ?? 0
    acc.exclusive_area += r.exclusive_area ?? 0
    acc.partial_common_area += r.partial_common_area ?? 0
    acc.other_common_area += r.other_common_area ?? 0
    acc.parking_common_area += r.parking_common_area ?? 0
    acc.sale_area += r.sale_area ?? 0
    acc.sale_price_excl_vat += r.sale_price_excl_vat ?? 0
    acc.sale_price_incl_vat += r.sale_price_incl_vat ?? 0
    return acc
  }, init)
}
