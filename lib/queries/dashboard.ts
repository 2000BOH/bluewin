// 대시보드 요약 쿼리 모음.
// 서버 컴포넌트에서 호출해 KPI/목록 위젯을 채운다.
// 쿼리는 모두 병렬 실행 가능하도록 독립 함수로 분리.

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  CommonStatus,
  RnrStaffNoEnum,
} from '@/types/supabase'

type Sb = SupabaseClient<Database>

// 상태별 민원 건수. COMMON_STATUSES 6개 모두 0 포함해 반환.
export type StatusCounts = Record<CommonStatus, number>

export const getMaintenanceStatusCounts = async (
  supabase: Sb,
): Promise<StatusCounts> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('status')
    .limit(5000)
  if (error) throw new Error(error.message)

  const init: StatusCounts = {
    접수: 0,
    입주지원: 0,
    영선: 0,
    외부업체: 0,
    퇴실: 0,
    청소: 0,
    완료: 0,
  }
  for (const row of data ?? []) {
    if (row.status in init) init[row.status as CommonStatus]++
  }
  return init
}

// R&R 번호별 담당 건수(상태 무관).
export type RnrCounts = Record<RnrStaffNoEnum, number>

export const getRnrCounts = async (supabase: Sb): Promise<RnrCounts> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('rnr_no')
    .limit(5000)
  if (error) throw new Error(error.message)
  const init: RnrCounts = { '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0 }
  for (const row of data ?? []) {
    if (row.rnr_no && row.rnr_no in init) init[row.rnr_no as RnrStaffNoEnum]++
  }
  return init
}

// 총 계약 수.
export const getContractTotal = async (supabase: Sb): Promise<number> => {
  const { count, error } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

// 운영종료일 또는 임대종료일이 지정된 기간 내인 계약 수.
// 기본: 오늘부터 90일 이내 만료.
export const getExpiringContractCount = async (
  supabase: Sb,
  days = 90,
): Promise<number> => {
  const today = new Date()
  const until = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  const fromStr = today.toISOString().slice(0, 10)
  const toStr = until.toISOString().slice(0, 10)

  const { count, error } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .or(
      `and(operation_end.gte.${fromStr},operation_end.lte.${toStr}),and(lease_end.gte.${fromStr},lease_end.lte.${toStr})`,
    )
  if (error) throw new Error(error.message)
  return count ?? 0
}

// 최근 접수된 민원 N건(상태=접수).
export type InboxPreviewRow = {
  id: string
  phase: number
  room_no: string
  title: string
  status: CommonStatus
  stay_type: string | null
  rnr_no: RnrStaffNoEnum | null
  requester: string | null
  created_at: string
}

export const getRecentInbox = async (
  supabase: Sb,
  limit = 5,
): Promise<InboxPreviewRow[]> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('id, phase, room_no, title, status, stay_type, rnr_no, requester, created_at')
    .eq('status', '접수')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as InboxPreviewRow[]
}

// 만료 임박 계약 N건(운영종료 또는 임대종료 기준 가까운 순).
export type ExpiringContractRow = {
  id: string
  phase: number
  room_no: string
  tenant_name: string | null
  operation_end: string | null
  lease_end: string | null
  accommodation_type: string | null
}

export const getExpiringContracts = async (
  supabase: Sb,
  days = 90,
  limit = 5,
): Promise<ExpiringContractRow[]> => {
  const today = new Date()
  const until = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  const fromStr = today.toISOString().slice(0, 10)
  const toStr = until.toISOString().slice(0, 10)

  // 운영종료/임대종료 둘 중 가까운 것 기준 정렬이 쿼리 레벨에선 복잡하므로,
  // 두 컬럼 각각 조회 후 병합·정렬한다.
  const [opRes, leaseRes] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, phase, room_no, tenant_name, operation_end, lease_end, accommodation_type')
      .gte('operation_end', fromStr)
      .lte('operation_end', toStr)
      .order('operation_end', { ascending: true })
      .limit(limit),
    supabase
      .from('contracts')
      .select('id, phase, room_no, tenant_name, operation_end, lease_end, accommodation_type')
      .gte('lease_end', fromStr)
      .lte('lease_end', toStr)
      .order('lease_end', { ascending: true })
      .limit(limit),
  ])
  if (opRes.error) throw new Error(opRes.error.message)
  if (leaseRes.error) throw new Error(leaseRes.error.message)

  const merged = new Map<string, ExpiringContractRow>()
  for (const row of (opRes.data ?? []) as ExpiringContractRow[]) merged.set(row.id, row)
  for (const row of (leaseRes.data ?? []) as ExpiringContractRow[]) {
    if (!merged.has(row.id)) merged.set(row.id, row)
  }

  const list = Array.from(merged.values())
  // 가장 가까운 종료일 기준 정렬.
  const pickEarliest = (r: ExpiringContractRow): string => {
    const candidates = [r.operation_end, r.lease_end].filter(
      (v): v is string => !!v && v >= fromStr && v <= toStr,
    )
    return candidates.sort()[0] ?? '9999-99-99'
  }
  list.sort((a, b) => pickEarliest(a).localeCompare(pickEarliest(b)))
  return list.slice(0, limit)
}
