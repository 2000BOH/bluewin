// 계약(contracts) CRUD 및 목록 조회.
// Phase 11 에서는 목록(11개 기본 컬럼) 위주로 사용.
// Phase 12/13 상세/등록 폼은 후속 단계에서 확장.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type ContractRow = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']

// 목록 표시용. 기본 11컬럼 외 펼치기 컬럼까지 포함하기 위해 buyer/room join 데이터를 같이 담는다.
export type ContractListItem = ContractRow & {
  buyer_name: string | null
  buyer_no: string | null
  buyer_type: '개인' | '법인' | null
  room_type: string | null
  view_type: string | null
  sale_area: number | null           // 분양면적 (rooms)
  sale_price_incl_vat: number | null // 총공급금액 계산용 (rooms VAT포함)
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

  // buyer 정보 조회 (이름/번호/유형).
  const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id).filter(Boolean)))
  type BuyerInfo = { name: string | null; no: string | null; type: '개인' | '법인' | null }
  const buyerMap = new Map<string, BuyerInfo>()
  if (buyerIds.length > 0) {
    const { data: bData } = await supabase
      .from('buyers')
      .select('id, name1, buyer_no, buyer_type')
      .in('id', buyerIds)
    for (const b of bData ?? [])
      buyerMap.set(b.id, { name: b.name1 ?? null, no: b.buyer_no ?? null, type: b.buyer_type })
  }

  // 객실 정보 조회 (타입·조망·분양면적·분양금액).
  type RoomInfo = {
    type: string | null
    view_type: string | null
    sale_area: number | null
    sale_price_incl_vat: number | null
  }
  const roomKeyMap = new Map<string, RoomInfo>()
  const phaseSet = Array.from(new Set(rows.map((r) => r.phase)))
  if (phaseSet.length > 0) {
    const { data: rData } = await supabase
      .from('rooms')
      .select('phase, room_no, type, view_type, sale_area, sale_price_incl_vat')
      .in('phase', phaseSet)
    for (const r of rData ?? []) {
      roomKeyMap.set(`${r.phase}|${r.room_no}`, {
        type: r.type,
        view_type: r.view_type,
        sale_area: r.sale_area,
        sale_price_incl_vat: r.sale_price_incl_vat,
      })
    }
  }

  let items: ContractListItem[] = rows.map((r) => {
    const room = roomKeyMap.get(`${r.phase}|${r.room_no}`)
    const b = buyerMap.get(r.buyer_id)
    return {
      ...r,
      buyer_name: b?.name ?? null,
      buyer_no: b?.no ?? null,
      buyer_type: b?.type ?? null,
      room_type: room?.type ?? null,
      view_type: room?.view_type ?? null,
      sale_area: room?.sale_area ?? null,
      sale_price_incl_vat: room?.sale_price_incl_vat ?? null,
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
