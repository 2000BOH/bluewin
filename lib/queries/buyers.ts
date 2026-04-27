// 수분양자(buyers) CRUD.
// ⚠️ 주민번호(ssn1/ssn2)는 bytea(pgcrypto pgp_sym_encrypt) 컬럼.
//    Phase 10 단계에서는 SQL 함수/RPC 연동 미구현 → ssn 입력값은 일단 무시(저장 안 함).
//    Phase 후속에서 supabase RPC `encrypt_ssn(plain text, key text)` 추가 후 폼 연결 예정.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, BuyerType } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type BuyerRow = Database['public']['Tables']['buyers']['Row']
export type BuyerInsert = Database['public']['Tables']['buyers']['Insert']
export type BuyerUpdate = Database['public']['Tables']['buyers']['Update']

export type BuyerFilter = {
  buyerNo?: string | null
  buyerType?: BuyerType | null
  name?: string | null
  phase?: number | null
  roomNo?: string | null
  contractForm?: string | null
  accommodationType?: string | null
  operationType?: string | null
}

export const listBuyers = async (
  supabase: Sb,
  filter: BuyerFilter = {},
): Promise<BuyerRow[]> => {
  let query = supabase
    .from('buyers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (filter.buyerNo) query = query.ilike('buyer_no', `%${filter.buyerNo}%`)
  if (filter.buyerType) query = query.eq('buyer_type', filter.buyerType)
  if (filter.name) {
    query = query.or(`name1.ilike.%${filter.name}%,name2.ilike.%${filter.name}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  let rows = (data ?? []) as BuyerRow[]

  // 차수/호수/계약형태/숙박형태/운영방식 필터는 contracts 조인 결과로 후처리 (간단화).
  const needContract =
    filter.phase != null ||
    !!filter.roomNo ||
    !!filter.contractForm ||
    !!filter.accommodationType ||
    !!filter.operationType
  if (needContract) {
    let cQuery = supabase.from('contracts').select('buyer_id, phase, room_no')
    if (filter.phase != null) cQuery = cQuery.eq('phase', filter.phase)
    if (filter.roomNo) cQuery = cQuery.ilike('room_no', `%${filter.roomNo}%`)
    if (filter.contractForm) cQuery = cQuery.ilike('contract_form', `%${filter.contractForm}%`)
    if (filter.accommodationType)
      cQuery = cQuery.ilike('accommodation_type', `%${filter.accommodationType}%`)
    if (filter.operationType) cQuery = cQuery.ilike('operation_type', `%${filter.operationType}%`)
    const { data: cData } = await cQuery
    const allowed = new Set((cData ?? []).map((c) => c.buyer_id))
    rows = rows.filter((b) => allowed.has(b.id))
  }

  return rows
}

export const getBuyer = async (supabase: Sb, id: string): Promise<BuyerRow | null> => {
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as BuyerRow | null
}

export const createBuyer = async (supabase: Sb, payload: BuyerInsert): Promise<BuyerRow> => {
  const { data, error } = await supabase.from('buyers').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as BuyerRow
}

export const updateBuyer = async (
  supabase: Sb,
  id: string,
  payload: BuyerUpdate,
): Promise<BuyerRow> => {
  const { data, error } = await supabase
    .from('buyers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as BuyerRow
}

export const deleteBuyer = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('buyers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// 수분양자별 계약중/계약해지 호수 카운트.
// 현재 스키마에는 계약 종료 플래그가 없으므로, lease_end 가 오늘 이전이면 "해지"로 간주.
export type BuyerContractCount = { active: number; ended: number }

export const getBuyerContractCounts = async (
  supabase: Sb,
  buyerIds: string[],
): Promise<Record<string, BuyerContractCount>> => {
  const result: Record<string, BuyerContractCount> = {}
  if (buyerIds.length === 0) return result
  const { data, error } = await supabase
    .from('contracts')
    .select('buyer_id, lease_end, operation_end')
    .in('buyer_id', buyerIds)
  if (error) throw new Error(error.message)
  const today = new Date().toISOString().slice(0, 10)
  for (const id of buyerIds) result[id] = { active: 0, ended: 0 }
  for (const row of data ?? []) {
    const bucket = result[row.buyer_id] ?? (result[row.buyer_id] = { active: 0, ended: 0 })
    const end = row.lease_end ?? row.operation_end ?? null
    if (end && end < today) bucket.ended += 1
    else bucket.active += 1
  }
  return result
}

// 특정 buyer 의 계약 목록 (수분양자 상세에서 사용).
export type BuyerContractSummary = {
  id: string
  phase: number
  room_no: string
  contract_no: string | null
  contract_date: string | null
  operation_end: string | null
  lease_end: string | null
}

export const listContractsByBuyer = async (
  supabase: Sb,
  buyerId: string,
): Promise<BuyerContractSummary[]> => {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, phase, room_no, contract_no, contract_date, operation_end, lease_end')
    .eq('buyer_id', buyerId)
    .order('phase', { ascending: true })
    .order('room_no', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as BuyerContractSummary[]
}
