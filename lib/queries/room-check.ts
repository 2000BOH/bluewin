// 객실체크(room_checks) CRUD.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CommonStatus, OverallCheckStatus, Json } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type CheckRow = Database['public']['Tables']['room_checks']['Row']
export type CheckInsert = Database['public']['Tables']['room_checks']['Insert']
export type CheckUpdate = Database['public']['Tables']['room_checks']['Update']

// 체크리스트 항목 정의 (8개) — UI 와 DB 양쪽에서 공유.
export const CHECKLIST_ITEMS = [
  { key: 'cleanliness', label: '청결 상태' },
  { key: 'amenities', label: '비품 유무' },
  { key: 'damage', label: '파손 여부' },
  { key: 'aircon', label: '에어컨/냉난방' },
  { key: 'water', label: '수도/배수' },
  { key: 'electric', label: '전기/조명' },
  { key: 'doorlock', label: '도어락' },
  { key: 'etc', label: '기타' },
] as const

export type ChecklistItemValue = '정상' | '불량' | '해당없음'
export type ChecklistMap = Record<string, ChecklistItemValue>

export type CheckFilter = {
  phase?: number | null
  roomNo?: string | null
  status?: CommonStatus | null
  statusNot?: CommonStatus | null
  // 여러 상태를 동시에 제외할 때 사용 (이동된 레코드 숨김 등)
  statusNotIn?: CommonStatus[]
  overall?: OverallCheckStatus | null
  checker?: string | null
  from?: string | null
  to?: string | null
}

export const listChecks = async (
  supabase: Sb,
  filter: CheckFilter = {},
): Promise<CheckRow[]> => {
  let query = supabase
    .from('room_checks')
    .select('*')
    .order('check_date', { ascending: false })
    .limit(500)

  if (filter.phase != null) query = query.eq('phase', filter.phase)
  if (filter.roomNo) query = query.ilike('room_no', `%${filter.roomNo}%`)
  if (filter.status)    query = query.eq('status', filter.status)
  if (filter.statusNot) query = query.neq('status', filter.statusNot)
  if (filter.statusNotIn?.length) {
    // Supabase not.in 필터로 여러 상태 동시 제외
    query = query.not('status', 'in', `(${filter.statusNotIn.join(',')})`)
  }
  if (filter.overall)   query = query.eq('overall_status', filter.overall)
  if (filter.checker)   query = query.ilike('checker', `%${filter.checker}%`)
  if (filter.from) query = query.gte('check_date', filter.from)
  if (filter.to) query = query.lte('check_date', filter.to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as CheckRow[]
}

export const createCheck = async (supabase: Sb, payload: CheckInsert): Promise<CheckRow> => {
  const { data, error } = await supabase.from('room_checks').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as CheckRow
}

export const updateCheck = async (
  supabase: Sb,
  id: string,
  payload: CheckUpdate,
): Promise<CheckRow> => {
  const { data, error } = await supabase
    .from('room_checks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as CheckRow
}

export const deleteCheck = async (supabase: Sb, id: string): Promise<void> => {
  const { error } = await supabase.from('room_checks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// 폼에서 받은 값(문자열) 을 jsonb 로 정규화.
export const normalizeChecklist = (input: Record<string, string>): Json => {
  const out: ChecklistMap = {}
  for (const { key } of CHECKLIST_ITEMS) {
    const v = input[key]
    if (v === '정상' || v === '불량' || v === '해당없음') out[key] = v
  }
  return out as unknown as Json
}
