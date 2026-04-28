// change_history 조회 쿼리.
//
// 필터:
//   tableName : 단일 테이블 한정
//   action    : insert / update / delete
//   from / to : changed_at 범위 (YYYY-MM-DD)
//   phase     : 차수 — 해당 차수의 record_id 목록을 미리 조회 후 in() 필터
//   roomNo    : 호수 — 동일 방식 (room_transfers 는 from_*/to_* 양쪽 매칭)
//   q         : 검색어 — field_name_ko + old_value/new_value(JSON 문자열) 부분일치
//                서버에선 field_name_ko 만 ilike, 결과 메모리에서 값 검색까지 확장.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type HistoryRow = Database['public']['Tables']['change_history']['Row']

export type HistoryFilter = {
  tableName?: string | null
  action?: 'insert' | 'update' | 'delete' | null
  from?: string | null
  to?: string | null
  q?: string | null
  phase?: number | null
  roomNo?: string | null
}

// phase / roomNo 컬럼 구조가 다른 테이블 정의.
const PHASE_ROOM_TABLES: Array<
  | { table: 'rooms' | 'contracts' | 'maintenance_requests' | 'room_checks' | 'room_maintenance_tasks'; kind: 'standard' }
  | { table: 'room_transfers'; kind: 'transfer' }
> = [
  { table: 'rooms', kind: 'standard' },
  { table: 'contracts', kind: 'standard' },
  { table: 'maintenance_requests', kind: 'standard' },
  { table: 'room_checks', kind: 'standard' },
  { table: 'room_maintenance_tasks', kind: 'standard' },
  { table: 'room_transfers', kind: 'transfer' },
]

// 차수/호수에 매칭되는 record_id 목록 조회.
const lookupRecordIds = async (
  supabase: Sb,
  filter: HistoryFilter,
): Promise<string[] | null> => {
  if (filter.phase == null && !filter.roomNo) return null

  // tableName 이 지정돼 있으면 그 테이블만, 아니면 phase/room_no 가진 모든 테이블 조회.
  const targets = filter.tableName
    ? PHASE_ROOM_TABLES.filter((t) => t.table === filter.tableName)
    : PHASE_ROOM_TABLES

  const ids: string[] = []
  for (const t of targets) {
    if (t.kind === 'standard') {
      let q = supabase.from(t.table).select('id')
      if (filter.phase != null) q = q.eq('phase', filter.phase)
      if (filter.roomNo) q = q.ilike('room_no', `%${filter.roomNo}%`)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      for (const r of data ?? []) ids.push((r as { id: string }).id)
    } else {
      // room_transfers: from_*/to_* 양쪽 매칭(OR).
      const orParts: string[] = []
      if (filter.phase != null) {
        orParts.push(`from_phase.eq.${filter.phase}`)
        orParts.push(`to_phase.eq.${filter.phase}`)
      }
      if (filter.roomNo) {
        orParts.push(`from_room_no.ilike.%${filter.roomNo}%`)
        orParts.push(`to_room_no.ilike.%${filter.roomNo}%`)
      }
      const { data, error } = await supabase
        .from('room_transfers')
        .select('id')
        .or(orParts.join(','))
      if (error) throw new Error(error.message)
      for (const r of data ?? []) ids.push((r as { id: string }).id)
    }
  }
  return ids
}

// 메모리 단계 검색어 매치 — field_name_ko / old_value / new_value 통합.
const matchesQuery = (row: HistoryRow, q: string): boolean => {
  const needle = q.toLowerCase()
  const fld = (row.field_name_ko ?? '').toLowerCase()
  if (fld.includes(needle)) return true
  const ov = JSON.stringify(row.old_value ?? '').toLowerCase()
  if (ov.includes(needle)) return true
  const nv = JSON.stringify(row.new_value ?? '').toLowerCase()
  if (nv.includes(needle)) return true
  return false
}

export const listHistory = async (
  supabase: Sb,
  filter: HistoryFilter = {},
  limit = 500,
): Promise<HistoryRow[]> => {
  // 차수/호수 필터가 있으면 record_id 목록 먼저 확보.
  const recordIds = await lookupRecordIds(supabase, filter)
  if (recordIds !== null && recordIds.length === 0) {
    return [] // 매칭 record 없음
  }

  let query = supabase
    .from('change_history')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (filter.tableName) query = query.eq('table_name', filter.tableName)
  if (filter.action) query = query.eq('action', filter.action)
  if (filter.from) query = query.gte('changed_at', filter.from)
  if (filter.to) query = query.lte('changed_at', filter.to)
  if (recordIds && recordIds.length > 0) query = query.in('record_id', recordIds)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  let rows = (data ?? []) as HistoryRow[]

  // 검색어는 인메모리 — field_name_ko 외 값까지 통합 검색.
  if (filter.q) {
    rows = rows.filter((r) => matchesQuery(r, filter.q as string))
  }

  return rows
}
