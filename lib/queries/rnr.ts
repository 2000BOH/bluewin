// rnr_mapping 테이블 쿼리.
// 담당자 번호-이름 및 숙박형태 배분 규칙을 DB 에서 읽는다.
// UI 에서는 이 규칙을 /lib/utils/rnr.ts 의 assignRnrByStayType 에 전달해 배분한다.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, RnrStaffNoEnum } from '@/types/supabase'
import type { StayType } from '@/types/status'
import { toRnrRules, type RnrRule } from '@/lib/utils/rnr'

type Sb = SupabaseClient<Database>

export type RnrMappingRow = {
  rnr_no: RnrStaffNoEnum
  name: string | null
  stay_types: StayType[]
}

// 6명의 담당자 매핑을 rnr_no 오름차순으로 조회.
export const listRnrMapping = async (supabase: Sb): Promise<RnrMappingRow[]> => {
  const { data, error } = await supabase
    .from('rnr_mapping')
    .select('rnr_no, name, stay_types')
    .order('rnr_no', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    rnr_no: row.rnr_no,
    name: row.name,
    stay_types: Array.isArray(row.stay_types)
      ? (row.stay_types as unknown[]).filter(
          (v): v is StayType => typeof v === 'string',
        )
      : [],
  }))
}

// 규칙만 추출 (assignRnrByStayType 인자용).
export const loadRnrRules = async (supabase: Sb): Promise<RnrRule[]> => {
  const rows = await listRnrMapping(supabase)
  return toRnrRules(rows.map((r) => ({ rnr_no: r.rnr_no, stay_types: r.stay_types })))
}

// rnr_no → 이름 매핑 맵.
export const buildRnrNameMap = (
  rows: RnrMappingRow[],
): Record<RnrStaffNoEnum, string | null> => {
  const map: Record<string, string | null> = {}
  for (const row of rows) map[row.rnr_no] = row.name
  return map as Record<RnrStaffNoEnum, string | null>
}
