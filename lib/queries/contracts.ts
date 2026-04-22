// 계약(contracts) CRUD 및 목록 조회.
// Phase 11 에서는 목록(11개 기본 컬럼) 위주로 사용.
// Phase 12/13 상세/등록 폼은 후속 단계에서 확장.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type ContractRow = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']

// 목록 표시용 (계약자명/객실타입·조망 포함).
export type ContractListItem = ContractRow & {
  buyer_name: string | null
  room_type: string | null
  view_type: string | null
}

export type ContractFilter = {
  phase?: number | null
  roomNo?: string | null
  viewType?: string | null
  buyerName?: string | null
  reverseIssuance?: boolean | null
  operationType?: string | null
  contractForm?: string | null
  accommodationType?: string | null
}

export const listContracts = async (
  supabase: Sb,
  filter: ContractFilter = {},
): Promise<ContractListItem[]> => {
  let query = supabase
    .from('contracts')
    .select('*')
    .order('phase', { ascending: true })
    .order('room_no', { ascending: true })
    .limit(2000)

  if (filter.phase != null) query = query.eq('phase', filter.phase)
  if (filter.roomNo) query = query.ilike('room_no', `%${filter.roomNo}%`)
  if (filter.reverseIssuance != null) query = query.eq('reverse_issuance', filter.reverseIssuance)
  if (filter.operationType) query = query.ilike('operation_type', `%${filter.operationType}%`)
  if (filter.contractForm) query = query.ilike('contract_form', `%${filter.contractForm}%`)
  if (filter.accommodationType)
    query = query.ilike('accommodation_type', `%${filter.accommodationType}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as ContractRow[]

  // buyer 이름 조회.
  const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id).filter(Boolean)))
  const buyerMap = new Map<string, string>()
  if (buyerIds.length > 0) {
    const { data: bData } = await supabase
      .from('buyers')
      .select('id, name1')
      .in('id', buyerIds)
    for (const b of bData ?? []) buyerMap.set(b.id, b.name1 ?? '')
  }

  // 객실 타입/조망 조회 (phase, room_no 묶음).
  const roomKeyMap = new Map<string, { type: string | null; view_type: string | null }>()
  const phaseSet = Array.from(new Set(rows.map((r) => r.phase)))
  if (phaseSet.length > 0) {
    const { data: rData } = await supabase
      .from('rooms')
      .select('phase, room_no, type, view_type')
      .in('phase', phaseSet)
    for (const r of rData ?? []) {
      roomKeyMap.set(`${r.phase}|${r.room_no}`, { type: r.type, view_type: r.view_type })
    }
  }

  let items: ContractListItem[] = rows.map((r) => {
    const room = roomKeyMap.get(`${r.phase}|${r.room_no}`)
    return {
      ...r,
      buyer_name: buyerMap.get(r.buyer_id) ?? null,
      room_type: room?.type ?? null,
      view_type: room?.view_type ?? null,
    }
  })

  if (filter.viewType) {
    const v = filter.viewType
    items = items.filter((r) => (r.view_type ?? '').includes(v))
  }
  if (filter.buyerName) {
    const n = filter.buyerName
    items = items.filter((r) => (r.buyer_name ?? '').includes(n))
  }

  return items
}

export const getContract = async (
  supabase: Sb,
  id: string,
): Promise<ContractRow | null> => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as ContractRow | null
}

export const createContract = async (
  supabase: Sb,
  payload: ContractInsert,
): Promise<ContractRow> => {
  const { data, error } = await supabase
    .from('contracts')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ContractRow
}

export const updateContract = async (
  supabase: Sb,
  id: string,
  payload: ContractUpdate,
): Promise<ContractRow> => {
  const { data, error } = await supabase
    .from('contracts')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ContractRow
}

export const deleteContract = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
