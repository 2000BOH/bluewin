// 집계용 쿼리 모음. 분양/운영/만료/객실현황 Summary 페이지에서 사용.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { OPERATION_TYPES, STAY_TYPES } from '@/types/status'

type Sb = SupabaseClient<Database>
import { listContracts, type ContractListItem } from './contracts'
type RoomLite = Pick<
  Database['public']['Tables']['rooms']['Row'],
  'id' | 'phase' | 'room_no' | 'type' | 'view_type' | 'sale_price_excl_vat' | 'sale_price_incl_vat'
>
type ContractLite = Pick<
  Database['public']['Tables']['contracts']['Row'],
  | 'id' | 'phase' | 'room_no' | 'buyer_id' | 'operation_type' | 'accommodation_type'
  | 'operation_end' | 'lease_end' | 'tenant_name' | 'tenant_phone'
>

export type RoomStatusRow = RoomLite & {
  is_sold: boolean
  contract_id: string | null
  buyer_name: string | null
  operation_type: string | null
  accommodation_type: string | null
  tenant_name: string | null
  tenant_phone: string | null
  lease_end: string | null
}

// 객실현황: rooms + contracts left join + buyer name.
export const getRoomStatus = async (supabase: Sb): Promise<RoomStatusRow[]> => {
  const [{ data: rData }, { data: cData }] = await Promise.all([
    supabase.from('rooms').select('id, phase, room_no, type, view_type, sale_price_excl_vat, sale_price_incl_vat').order('phase').order('room_no'),
    supabase.from('contracts').select('id, phase, room_no, buyer_id, operation_type, accommodation_type, operation_end, lease_end, tenant_name, tenant_phone'),
  ])
  const rooms = (rData ?? []) as RoomLite[]
  const contracts = (cData ?? []) as ContractLite[]

  const buyerIds = Array.from(new Set(contracts.map((c) => c.buyer_id)))
  const buyerMap = new Map<string, string>()
  if (buyerIds.length > 0) {
    const { data: bData } = await supabase.from('buyers').select('id, name1').in('id', buyerIds)
    for (const b of bData ?? []) buyerMap.set(b.id, b.name1 ?? '')
  }

  const cMap = new Map<string, ContractLite>()
  for (const c of contracts) cMap.set(`${c.phase}|${c.room_no}`, c)

  return rooms.map((r) => {
    const c = cMap.get(`${r.phase}|${r.room_no}`)
    return {
      ...r,
      is_sold: !!c,
      contract_id: c?.id ?? null,
      buyer_name: c ? buyerMap.get(c.buyer_id) ?? null : null,
      operation_type: c?.operation_type ?? null,
      accommodation_type: c?.accommodation_type ?? null,
      tenant_name: c?.tenant_name ?? null,
      tenant_phone: c?.tenant_phone ?? null,
      lease_end: c?.lease_end ?? null,
    }
  })
}

// 분양 Summary: 차수별 총실/계약/미계약/금액합계.
export type SalesSummaryRow = {
  phase: number
  total: number
  sold: number
  available: number
  sale_price_excl_vat: number
  sale_price_incl_vat: number
}

export const getSalesSummary = async (supabase: Sb): Promise<SalesSummaryRow[]> => {
  const status = await getRoomStatus(supabase)
  const map = new Map<number, SalesSummaryRow>()
  for (const r of status) {
    const cur = map.get(r.phase) ?? {
      phase: r.phase,
      total: 0,
      sold: 0,
      available: 0,
      sale_price_excl_vat: 0,
      sale_price_incl_vat: 0,
    }
    cur.total += 1
    if (r.is_sold) cur.sold += 1
    else cur.available += 1
    cur.sale_price_excl_vat += r.sale_price_excl_vat ?? 0
    cur.sale_price_incl_vat += r.sale_price_incl_vat ?? 0
    map.set(r.phase, cur)
  }
  return Array.from(map.values()).sort((a, b) => a.phase - b.phase)
}

// 운영숙박 Summary: 운영방식 + 숙박형태 조합별 카운트.
export type OperationSummaryRow = {
  operation_type: string
  accommodation_type: string
  count: number
}

export const getOperationSummary = async (supabase: Sb): Promise<OperationSummaryRow[]> => {
  const { data, error } = await supabase
    .from('contracts')
    .select('operation_type, accommodation_type')
  if (error) throw new Error(error.message)
  const map = new Map<string, OperationSummaryRow>()
  for (const c of data ?? []) {
    const op = c.operation_type ?? '미지정'
    const acc = c.accommodation_type ?? '미지정'
    const key = `${op}__${acc}`
    const cur = map.get(key) ?? { operation_type: op, accommodation_type: acc, count: 0 }
    cur.count += 1
    map.set(key, cur)
  }
  return Array.from(map.values()).sort((a, b) =>
    a.operation_type === b.operation_type
      ? a.accommodation_type.localeCompare(b.accommodation_type)
      : a.operation_type.localeCompare(b.operation_type),
  )
}

// 만료 Summary: 운영종료가 타겟 일수 이내인 계약 목록.
export type ExpiryRow = ContractListItem & {
  days_left: number
}

export const getExpirySummary = async (
  supabase: Sb,
  targetDays = 90,
): Promise<ExpiryRow[]> => {
  // 전체 계약 목록 조회 (ContractListItem 형식)
  const allContracts = await listContracts(supabase)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today.getTime() + targetDays * 24 * 60 * 60 * 1000)

  const rows: ExpiryRow[] = []
  for (const c of allContracts) {
    // 1. 사용금지 객실 제외
    if (c.accommodation_type === '사용금지') continue

    // 2. 오직 운영종료일만 확인
    if (!c.operation_end) continue
    const d = new Date(c.operation_end)
    if (Number.isNaN(d.getTime())) continue

    // 3. 양수/음수에 따른 수집 범위 분할
    // - 양수(예: 30): 오늘 <= 만료일 <= (오늘 + 30일)
    // - 음수(예: -30): (오늘 - 30일) <= 만료일 < 오늘
    let isIncluded = false
    if (targetDays >= 0) {
      if (d >= today && d <= limit) isIncluded = true
    } else {
      if (d >= limit && d < today) isIncluded = true
    }

    if (!isIncluded) continue

    const days_left = Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    rows.push({
      ...c,
      days_left,
    })
  }
  return rows.sort((a, b) => a.days_left - b.days_left)
}

// ============================================================================
// 분양관리 Summary 페이지용 피봇 집계 (이미지 레이아웃 매칭).
// 객실(rooms) 기준으로 계약(contracts) 을 LEFT JOIN 한 후
// 차수 × {운영방식 / 숙박형태} 2차원 테이블로 피봇한다.
// ============================================================================

export type PivotTable = {
  phases: number[]                 // 행 (1차, 2차, ...)
  columns: string[]                // 열 (운영방식 또는 숙박형태)
  cells: Record<number, Record<string, number>>  // cells[phase][col] = count
  rowTotals: Record<number, number>
  colTotals: Record<string, number>
  grandTotal: number
}

// 알려진 정렬 순서를 우선시하고, 데이터에 있지만 알려지지 않은 값은 뒤에 정렬.
const orderColumns = (values: Set<string>, known: readonly string[]): string[] => {
  const result: string[] = []
  for (const k of known) if (values.has(k)) result.push(k)
  const extras = Array.from(values).filter((v) => !known.includes(v as never))
  extras.sort()
  return [...result, ...extras]
}

const buildPivot = (
  rows: { phase: number; col: string }[],
  knownOrder: readonly string[],
): PivotTable => {
  const phases = new Set<number>()
  const columns = new Set<string>()
  const cells: Record<number, Record<string, number>> = {}
  for (const r of rows) {
    phases.add(r.phase)
    columns.add(r.col)
    if (!cells[r.phase]) cells[r.phase] = {}
    cells[r.phase][r.col] = (cells[r.phase][r.col] ?? 0) + 1
  }
  const phaseList = Array.from(phases).sort((a, b) => a - b)
  const colList = orderColumns(columns, knownOrder)

  const rowTotals: Record<number, number> = {}
  const colTotals: Record<string, number> = {}
  let grandTotal = 0
  for (const p of phaseList) {
    let rt = 0
    for (const c of colList) {
      const v = cells[p]?.[c] ?? 0
      rt += v
      colTotals[c] = (colTotals[c] ?? 0) + v
      grandTotal += v
    }
    rowTotals[p] = rt
  }
  return { phases: phaseList, columns: colList, cells, rowTotals, colTotals, grandTotal }
}

// 차수 × 운영방식 (객실 기준 — 미계약은 '미계약' 컬럼).
export const getOperationByPhasePivot = async (supabase: Sb): Promise<PivotTable> => {
  const status = await getRoomStatus(supabase)
  const rows = status.map((r) => ({
    phase: r.phase,
    col: r.operation_type ?? '미계약',
  }))
  return buildPivot(rows, [...OPERATION_TYPES, '미계약'])
}

// 차수 × 숙박형태 (객실 기준 — 미계약은 '미계약' 컬럼).
export const getStayByPhasePivot = async (supabase: Sb): Promise<PivotTable> => {
  const status = await getRoomStatus(supabase)
  const rows = status.map((r) => ({
    phase: r.phase,
    col: r.accommodation_type ?? '미계약',
  }))
  return buildPivot(rows, [...STAY_TYPES, '미계약'])
}

// 차수 × 숙박형태 — 객실수 + 숙박료(임대료 또는 확정지급액) 합계.
// "숙박료" 데이터 소스: 계약된 객실의 monthly_rent (없으면 settlement_amount 폴백).
export type RentPivotCell = { count: number; rent: number }
export type RentPivotTable = {
  phases: number[]
  columns: string[]
  cells: Record<number, Record<string, RentPivotCell>>
  rowTotals: Record<number, RentPivotCell>
  colTotals: Record<string, RentPivotCell>
  grandTotal: RentPivotCell
}

export const getRentByStayPivot = async (supabase: Sb): Promise<RentPivotTable> => {
  // 임대료 통계는 계약된 객실만 의미가 있으므로 계약 목록 사용.
  const contracts = await listContracts(supabase)
  const phases = new Set<number>()
  const columns = new Set<string>()
  const cells: Record<number, Record<string, RentPivotCell>> = {}

  // 임대 가능한 숙박형태만 (사용금지·공실·계약만료 제외).
  const RENT_RELEVANT = ['인스파이어', '장박_개인', '장박_법인', '호텔', '기숙사']
  for (const c of contracts) {
    const acc = c.accommodation_type ?? null
    if (!acc || !RENT_RELEVANT.includes(acc)) continue
    phases.add(c.phase)
    columns.add(acc)
    if (!cells[c.phase]) cells[c.phase] = {}
    if (!cells[c.phase][acc]) cells[c.phase][acc] = { count: 0, rent: 0 }
    cells[c.phase][acc].count += 1
    const rent = c.monthly_rent ?? c.settlement_amount ?? 0
    cells[c.phase][acc].rent += rent
  }

  const phaseList = Array.from(phases).sort((a, b) => a - b)
  const colList = orderColumns(columns, RENT_RELEVANT)

  const rowTotals: Record<number, RentPivotCell> = {}
  const colTotals: Record<string, RentPivotCell> = {}
  const grandTotal: RentPivotCell = { count: 0, rent: 0 }
  for (const p of phaseList) {
    let rt: RentPivotCell = { count: 0, rent: 0 }
    for (const c of colList) {
      const v = cells[p]?.[c] ?? { count: 0, rent: 0 }
      rt = { count: rt.count + v.count, rent: rt.rent + v.rent }
      const ct = colTotals[c] ?? { count: 0, rent: 0 }
      colTotals[c] = { count: ct.count + v.count, rent: ct.rent + v.rent }
      grandTotal.count += v.count
      grandTotal.rent += v.rent
    }
    rowTotals[p] = rt
  }
  return { phases: phaseList, columns: colList, cells, rowTotals, colTotals, grandTotal }
}

// ============================================================================
// 운영숙박 Detail — 차수 × 숙박형태 × 운영방식 3차원 cross-tab.
// 행: (차수, 숙박형태) 묶음, 열: 운영방식, 셀: 객실 수.
// ============================================================================

export type OperationDetailRow = {
  phase: number
  stay_type: string
  cells: Record<string, number>  // operation_type → count
  total: number
}

export type OperationDetailTable = {
  rows: OperationDetailRow[]
  columns: string[]                       // 운영방식 컬럼 순서
  phaseSubtotals: Record<number, { cells: Record<string, number>; total: number }>
  colTotals: Record<string, number>
  grandTotal: number
}

export const getOperationDetail = async (supabase: Sb): Promise<OperationDetailTable> => {
  const status = await getRoomStatus(supabase)

  const phases = new Set<number>()
  const stays = new Set<string>()
  const ops = new Set<string>()
  const cells = new Map<string, number>() // key: phase|stay|op

  for (const r of status) {
    const stay = r.accommodation_type ?? '미계약'
    const op = r.operation_type ?? '미계약'
    phases.add(r.phase)
    stays.add(stay)
    ops.add(op)
    const key = `${r.phase}|${stay}|${op}`
    cells.set(key, (cells.get(key) ?? 0) + 1)
  }

  const phaseList = Array.from(phases).sort((a, b) => a - b)
  const stayOrder = [...STAY_TYPES, '미계약']
  const opCols = orderColumns(ops, [...OPERATION_TYPES, '미계약'])

  const rows: OperationDetailRow[] = []
  const phaseSubtotals: Record<number, { cells: Record<string, number>; total: number }> = {}
  const colTotals: Record<string, number> = {}
  let grandTotal = 0

  for (const p of phaseList) {
    const sub: Record<string, number> = {}
    let phaseTotal = 0
    // 차수 내에서 stay 정렬: known 순서 우선
    const staysInPhase = orderColumns(
      new Set(Array.from(stays).filter((s) => Array.from(cells.keys()).some((k) => k.startsWith(`${p}|${s}|`)))),
      stayOrder,
    )
    for (const stay of staysInPhase) {
      const cellMap: Record<string, number> = {}
      let rowTotal = 0
      for (const op of opCols) {
        const v = cells.get(`${p}|${stay}|${op}`) ?? 0
        cellMap[op] = v
        rowTotal += v
        sub[op] = (sub[op] ?? 0) + v
        colTotals[op] = (colTotals[op] ?? 0) + v
      }
      rows.push({ phase: p, stay_type: stay, cells: cellMap, total: rowTotal })
      phaseTotal += rowTotal
      grandTotal += rowTotal
    }
    phaseSubtotals[p] = { cells: sub, total: phaseTotal }
  }
  return { rows, columns: opCols, phaseSubtotals, colTotals, grandTotal }
}

// ============================================================================
// 대시보드용 위젯 데이터.
// ============================================================================

// 신규 계약 월별 추이 (최근 12개월).
export type MonthlyContractRow = { month: string; count: number }
export const getMonthlyNewContracts = async (
  supabase: Sb,
  months = 12,
): Promise<MonthlyContractRow[]> => {
  const since = new Date()
  since.setMonth(since.getMonth() - (months - 1), 1)
  since.setHours(0, 0, 0, 0)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('contracts')
    .select('contract_date')
    .gte('contract_date', sinceStr)
  if (error) throw new Error(error.message)

  const buckets = new Map<string, number>()
  for (let i = 0; i < months; i++) {
    const d = new Date(since)
    d.setMonth(d.getMonth() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, 0)
  }
  for (const c of data ?? []) {
    if (!c.contract_date) continue
    const key = c.contract_date.slice(0, 7)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }))
}

// 영선 상태별 분포.
export type StatusDistRow = { status: string; count: number }
export const getMaintenanceStatusDist = async (supabase: Sb): Promise<StatusDistRow[]> => {
  const { data, error } = await supabase.from('maintenance_requests').select('status')
  if (error) throw new Error(error.message)
  const map = new Map<string, number>()
  for (const r of data ?? []) {
    const s = r.status ?? '미지정'
    map.set(s, (map.get(s) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }))
}

// 대시보드 KPI 카드 데이터.
export type DashboardKpi = {
  totalRooms: number
  contracted: number
  available: number
  contractRate: number
  occupied: number               // 임차인 있는 계약 수
  newThisMonth: number           // 이번 달 신규 계약
  pendingMaintenance: number     // status != 완료
}

export const getDashboardKpi = async (supabase: Sb): Promise<DashboardKpi> => {
  const [status, contracts, maintenance] = await Promise.all([
    getRoomStatus(supabase),
    listContracts(supabase),
    supabase.from('maintenance_requests').select('status'),
  ])
  const totalRooms = status.length
  const contracted = status.filter((r) => r.is_sold).length
  const available = totalRooms - contracted
  const contractRate = totalRooms > 0 ? (contracted / totalRooms) * 100 : 0
  const occupied = contracts.filter((c) => c.tenant_name).length

  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const newThisMonth = contracts.filter(
    (c) => c.contract_date && c.contract_date >= monthStart,
  ).length

  const pendingMaintenance = (maintenance.data ?? []).filter((m) => m.status !== '완료').length

  return {
    totalRooms,
    contracted,
    available,
    contractRate,
    occupied,
    newThisMonth,
    pendingMaintenance,
  }
}
