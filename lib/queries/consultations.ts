// 상담(consultations) CRUD.
// /consultations 는 등록/관리, /consultation-history 는 조회 전용.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type ConsultationRow = Database['public']['Tables']['consultations']['Row']
export type ConsultationInsert = Database['public']['Tables']['consultations']['Insert']
export type ConsultationUpdate = Database['public']['Tables']['consultations']['Update']

export type ConsultationListItem = ConsultationRow & {
  buyer_name: string | null
}

export type ConsultationFilter = {
  buyerId?: string | null
  buyerName?: string | null
  channel?: string | null
  from?: string | null
  to?: string | null
  q?: string | null
}

export const listConsultations = async (
  supabase: Sb,
  filter: ConsultationFilter = {},
): Promise<ConsultationListItem[]> => {
  let query = supabase
    .from('consultations')
    .select('*')
    .order('consult_date', { ascending: false })
    .limit(1000)

  if (filter.buyerId) query = query.eq('buyer_id', filter.buyerId)
  if (filter.channel) query = query.ilike('channel', `%${filter.channel}%`)
  if (filter.from) query = query.gte('consult_date', filter.from)
  if (filter.to) query = query.lte('consult_date', filter.to)
  if (filter.q) {
    query = query.or(
      `title.ilike.%${filter.q}%,content.ilike.%${filter.q}%,result.ilike.%${filter.q}%`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as ConsultationRow[]

  const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id)))
  const buyerMap = new Map<string, string>()
  if (buyerIds.length > 0) {
    const { data: bData } = await supabase
      .from('buyers')
      .select('id, name1')
      .in('id', buyerIds)
    for (const b of bData ?? []) buyerMap.set(b.id, b.name1 ?? '')
  }

  let items: ConsultationListItem[] = rows.map((r) => ({
    ...r,
    buyer_name: buyerMap.get(r.buyer_id) ?? null,
  }))
  if (filter.buyerName) {
    const n = filter.buyerName
    items = items.filter((r) => (r.buyer_name ?? '').includes(n))
  }
  return items
}

export const createConsultation = async (
  supabase: Sb,
  payload: ConsultationInsert,
): Promise<ConsultationRow> => {
  const { data, error } = await supabase
    .from('consultations')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ConsultationRow
}

export const updateConsultation = async (
  supabase: Sb,
  id: string,
  payload: ConsultationUpdate,
): Promise<ConsultationRow> => {
  const { data, error } = await supabase
    .from('consultations')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ConsultationRow
}

export const deleteConsultation = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('consultations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
