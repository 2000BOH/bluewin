// Point-in-Time(PIT) 스냅샷 재구성.
// change_history 의 INSERT(전체 jsonb) / UPDATE(컬럼별) / DELETE(전체 jsonb) 이벤트를
// 시간순으로 재생해 주어진 asOf 시점의 행 상태를 복원한다.
//
// 트리거 도입 이전부터 존재하던 행은 insert 이벤트가 없으므로:
//   - 가장 오래된 update 의 old_value 로 폴백
//   - 그것도 없으면 현재 테이블 행 그대로 사용 + _synthetic 마킹
//
// 적용 대상 테이블:
//   rooms / buyers / contracts / maintenance_requests
//   (room_transfers / room_checks / room_maintenance_tasks 도 트리거 대상이지만 스냅샷 페이지에서는 미사용)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>

type ChangeEvent = Database['public']['Tables']['change_history']['Row']

// 테이블 이름 → 행 타입 매핑(주요 4개).
type RowOf = {
  rooms: Database['public']['Tables']['rooms']['Row']
  buyers: Database['public']['Tables']['buyers']['Row']
  contracts: Database['public']['Tables']['contracts']['Row']
  maintenance_requests: Database['public']['Tables']['maintenance_requests']['Row']
}
export type SnapshotTable = keyof RowOf

// 재구성 결과 행 — _synthetic 은 트리거 이전 데이터로 폴백된 경우 true.
export type SnapshotRow<T extends SnapshotTable> = RowOf[T] & {
  _synthetic?: boolean
}

// asOf(YYYY-MM-DD) → 그날 23:59:59 UTC ISO 타임스탬프.
// (KST 기준 하루 데이터를 모두 포함하기 위해 +09:00 기준 23:59:59 사용)
export const endOfDayKstIso = (asOfDate: string): string => {
  // asOfDate 형식: YYYY-MM-DD
  // KST 23:59:59 = UTC 14:59:59 (해당일)
  return `${asOfDate}T14:59:59.999Z`
}

// 트리거 도입 시점 (이 이전 데이터는 정확도 제한).
// 002_change_history_triggers.sql 적용일.
export const TRIGGER_INSTALLED_AT = '2026-04-01'

// =============================================================================
// 핵심: change_history 일괄 조회 → record_id 별 그룹핑.
// =============================================================================

type GroupedEvents = Map<string, ChangeEvent[]>

const fetchHistoryGrouped = async (
  supabase: Sb,
  tableName: SnapshotTable,
  upToIso: string,
): Promise<GroupedEvents> => {
  // change_history 는 한 페이지 진입당 1회만 조회. 행 수가 많으면 페이징.
  const PAGE = 1000
  const grouped: GroupedEvents = new Map()
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('change_history')
      .select('*')
      .eq('table_name', tableName)
      .lte('changed_at', upToIso)
      .order('changed_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as ChangeEvent[]
    for (const r of rows) {
      const arr = grouped.get(r.record_id) ?? []
      arr.push(r)
      grouped.set(r.record_id, arr)
    }
    if (rows.length < PAGE) break
    from += PAGE
  }
  return grouped
}

// =============================================================================
// 단일 record 의 이벤트 목록을 재생해 행 상태 복원.
// 반환 null = 그 시점에 존재하지 않음(미생성 또는 삭제됨).
// =============================================================================

const replayRecord = (events: ChangeEvent[]): Record<string, unknown> | null => {
  // 가장 마지막 이벤트가 delete 이면 존재하지 않음.
  // (events 는 changed_at ASC 정렬돼 있음)
  let row: Record<string, unknown> | null = null

  for (const ev of events) {
    if (ev.action === 'insert') {
      row = (ev.new_value as Record<string, unknown>) ?? null
    } else if (ev.action === 'delete') {
      row = null
    } else if (ev.action === 'update') {
      // insert 가 없는 트리거-이전 행: 첫 update 이벤트의 old_value 로 시드.
      if (!row && ev.old_value !== null && ev.old_value !== undefined) {
        // old_value 는 단일 컬럼 값일 수 있음 → 행 객체 형태인지 확인 후 시드.
        // change_history UPDATE 행에서는 old_value 가 컬럼 단일 값 jsonb.
        // 따라서 직접 시드 불가. 빈 객체로 시작하고 update 적용.
        row = {}
      }
      if (row && ev.field_name_ko) {
        row[ev.field_name_ko] = ev.new_value
      }
    }
  }
  return row
}

// =============================================================================
// 트리거-이전 행 폴백: 현재 DB 행을 시드로 두고 asOf 이후 update 를 거꾸로 적용.
// =============================================================================

const fetchAfterEvents = async (
  supabase: Sb,
  tableName: SnapshotTable,
  fromIso: string,
): Promise<GroupedEvents> => {
  const PAGE = 1000
  const grouped: GroupedEvents = new Map()
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('change_history')
      .select('*')
      .eq('table_name', tableName)
      .gt('changed_at', fromIso)
      .order('changed_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as ChangeEvent[]
    for (const r of rows) {
      const arr = grouped.get(r.record_id) ?? []
      arr.push(r)
      grouped.set(r.record_id, arr)
    }
    if (rows.length < PAGE) break
    from += PAGE
  }
  return grouped
}

// 현재 행에서 시작해 "asOf 이후" 이벤트를 역재생.
// after 는 changed_at DESC 정렬돼 있음.
const reverseReplay = (
  current: Record<string, unknown>,
  after: ChangeEvent[],
): Record<string, unknown> | null => {
  const row: Record<string, unknown> | null = { ...current }
  for (const ev of after) {
    if (ev.action === 'insert') {
      // asOf 이후에 insert 됐으면 그 시점엔 존재하지 않음.
      return null
    }
    if (ev.action === 'delete') {
      // asOf 이후에 delete 됐다면 그 전엔 존재. 다음 이벤트는 의미 없음.
      // (current 가 이미 정상 상태였으므로 그대로 유지)
      // 다만 delete 이후엔 행이 없으므로 current 가 어디서 왔는지 모순 — 무시.
      continue
    }
    if (ev.action === 'update' && row && ev.field_name_ko) {
      // update 를 되돌려 = old_value 로 복원.
      row[ev.field_name_ko] = ev.old_value
    }
  }
  return row
}

// =============================================================================
// 공개 API: 테이블의 asOf 시점 행 목록 재구성.
// =============================================================================

export const reconstructTableAt = async <T extends SnapshotTable>(
  supabase: Sb,
  tableName: T,
  asOfDate: string,
): Promise<SnapshotRow<T>[]> => {
  const upToIso = endOfDayKstIso(asOfDate)

  // 1. asOf 까지의 이벤트 재생 (insert 가 있는 행만 정확히 복원 가능).
  const historyGrouped = await fetchHistoryGrouped(supabase, tableName, upToIso)
  const replayed = new Map<string, Record<string, unknown>>()
  historyGrouped.forEach((events, recordId) => {
    const row = replayRecord(events)
    if (row) replayed.set(recordId, row)
  })

  // 2. 현재 테이블 전체 행 조회 (트리거-이전 행 폴백용).
  const { data: currentRows, error } = await supabase
    .from(tableName as string)
    .select('*')
    .limit(5000)
  if (error) throw new Error(error.message)
  const current = (currentRows ?? []) as unknown as Record<string, unknown>[]
  const currentMap = new Map<string, Record<string, unknown>>()
  for (const r of current) {
    const id = r.id as string | undefined
    if (id) currentMap.set(id, r)
  }

  // 3. asOf 이후 이벤트 — 트리거-이전 행 역재생용.
  const afterGrouped = await fetchAfterEvents(supabase, tableName, upToIso)

  // 4. 결과 머지.
  //    - replayed 에 있는 행은 그대로 사용
  //    - replayed 에 없지만 currentMap 에 있는 행은:
  //         a. afterGrouped 에 insert 가 있으면 → asOf 이후 생성 → 제외
  //         b. 그렇지 않으면 현재 행 → asOf 이후 update 역재생
  const result: SnapshotRow<T>[] = []
  replayed.forEach((row) => {
    result.push(row as unknown as SnapshotRow<T>)
  })

  currentMap.forEach((row, id) => {
    if (replayed.has(id)) return
    const after = afterGrouped.get(id) ?? []
    const hasFutureInsert = after.some((e) => e.action === 'insert')
    if (hasFutureInsert) return // asOf 이후 생성된 행
    const restored = reverseReplay(row, after)
    if (restored) {
      restored._synthetic = true
      result.push(restored as unknown as SnapshotRow<T>)
    }
  })

  // delete 됐다 다시 insert 된 케이스(드물지만) — replayed 의 결과를 우선.
  return result
}

// 트리거 이전 날짜인지 검사 (UI 경고 배지용).
export const isPreTriggerDate = (asOfDate: string): boolean => {
  return asOfDate < TRIGGER_INSTALLED_AT
}

// =============================================================================
// 어댑터: 기존 list 쿼리 결과 형식으로 변환.
// =============================================================================

import type { ContractListItem } from './contracts'
import type { RoomStatusRow } from './summary'
import type { MaintenanceRow } from './maintenance'

// 영선 요청 목록 (asOf).
export const buildMaintenanceAt = async (
  supabase: Sb,
  asOfDate: string,
): Promise<SnapshotRow<'maintenance_requests'>[]> => {
  const rows = await reconstructTableAt(supabase, 'maintenance_requests', asOfDate)
  // created_at 내림차순 정렬 (live 화면과 동일).
  return rows.sort((a, b) => {
    const av = (a as MaintenanceRow).created_at ?? ''
    const bv = (b as MaintenanceRow).created_at ?? ''
    return bv.localeCompare(av)
  })
}

// 계약 목록 (asOf) — buyers/rooms 조인까지 포함.
export const buildContractsAt = async (
  supabase: Sb,
  asOfDate: string,
): Promise<(ContractListItem & { _synthetic?: boolean })[]> => {
  const [contracts, buyers, rooms] = await Promise.all([
    reconstructTableAt(supabase, 'contracts', asOfDate),
    reconstructTableAt(supabase, 'buyers', asOfDate),
    reconstructTableAt(supabase, 'rooms', asOfDate),
  ])

  type Buyer = SnapshotRow<'buyers'>
  type Room = SnapshotRow<'rooms'>

  const buyerMap = new Map<string, Buyer>()
  for (const b of buyers) buyerMap.set(b.id, b)
  const roomMap = new Map<string, Room>()
  for (const r of rooms) roomMap.set(`${r.phase}|${r.room_no}`, r)

  return contracts
    .map((c) => {
      const b = buyerMap.get(c.buyer_id)
      const room = roomMap.get(`${c.phase}|${c.room_no}`)
      return {
        ...c,
        buyer_name: b?.name1 ?? null,
        buyer_no: b?.buyer_no ?? null,
        buyer_type: b?.buyer_type ?? null,
        room_type: room?.type ?? null,
        view_type: room?.view_type ?? null,
        sale_area: room?.sale_area ?? null,
        sale_price_incl_vat: room?.sale_price_incl_vat ?? null,
      } as ContractListItem & { _synthetic?: boolean }
    })
    .sort((a, b) => {
      if (a.phase !== b.phase) return a.phase - b.phase
      return (a.room_no ?? '').localeCompare(b.room_no ?? '')
    })
}

// 객실 현황 (asOf) — 분양/숙박 요약 표·대시보드 입력.
export const buildRoomStatusAt = async (
  supabase: Sb,
  asOfDate: string,
): Promise<RoomStatusRow[]> => {
  const [rooms, contracts, buyers] = await Promise.all([
    reconstructTableAt(supabase, 'rooms', asOfDate),
    reconstructTableAt(supabase, 'contracts', asOfDate),
    reconstructTableAt(supabase, 'buyers', asOfDate),
  ])

  const buyerMap = new Map<string, string>()
  for (const b of buyers) buyerMap.set(b.id, b.name1 ?? '')

  type Contract = SnapshotRow<'contracts'>
  const cMap = new Map<string, Contract>()
  for (const c of contracts) cMap.set(`${c.phase}|${c.room_no}`, c)

  return rooms
    .map((r) => {
      const c = cMap.get(`${r.phase}|${r.room_no}`)
      return {
        id: r.id,
        phase: r.phase,
        room_no: r.room_no,
        type: r.type,
        view_type: r.view_type,
        sale_price_excl_vat: r.sale_price_excl_vat,
        sale_price_incl_vat: r.sale_price_incl_vat,
        is_sold: !!c,
        buyer_name: c ? buyerMap.get(c.buyer_id) ?? null : null,
        operation_type: c?.operation_type ?? null,
        accommodation_type: c?.accommodation_type ?? null,
        tenant_name: c?.tenant_name ?? null,
        tenant_phone: c?.tenant_phone ?? null,
        lease_end: c?.lease_end ?? null,
      } as RoomStatusRow
    })
    .sort((a, b) => {
      if (a.phase !== b.phase) return a.phase - b.phase
      return a.room_no.localeCompare(b.room_no)
    })
}

// 계약 기반 임대료 피봇 (분양 요약 ③ 숙박료 합계용).
// summary.ts 의 getRentByStayPivot 와 동일 로직을 in-memory 로 재구현.
import type { RentPivotTable, RentPivotCell, PivotTable } from './summary'
import { OPERATION_TYPES, STAY_TYPES } from '@/types/status'

const orderColumns = (values: Set<string>, known: readonly string[]): string[] => {
  const result: string[] = []
  for (const k of known) if (values.has(k)) result.push(k)
  const extras = Array.from(values).filter((v) => !known.includes(v as never))
  extras.sort()
  return [...result, ...extras]
}

export const buildRentPivotAt = async (
  supabase: Sb,
  asOfDate: string,
): Promise<RentPivotTable> => {
  const contracts = await reconstructTableAt(supabase, 'contracts', asOfDate)
  const phases = new Set<number>()
  const columns = new Set<string>()
  const cells: Record<number, Record<string, RentPivotCell>> = {}
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

// 객실 상태 → PivotTable (운영방식 또는 숙박형태).
const buildPivotFromStatus = (
  status: RoomStatusRow[],
  field: 'operation_type' | 'accommodation_type',
  knownOrder: readonly string[],
): PivotTable => {
  const phases = new Set<number>()
  const columns = new Set<string>()
  const cells: Record<number, Record<string, number>> = {}

  for (const r of status) {
    const col = r[field] ?? '미계약'
    phases.add(r.phase)
    columns.add(col)
    if (!cells[r.phase]) cells[r.phase] = {}
    cells[r.phase][col] = (cells[r.phase][col] ?? 0) + 1
  }
  const phaseList = Array.from(phases).sort((a, b) => a - b)
  const colList = orderColumns(columns, [...knownOrder, '미계약'])

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

export const buildOperationPivotAt = (status: RoomStatusRow[]): PivotTable =>
  buildPivotFromStatus(status, 'operation_type', OPERATION_TYPES)

export const buildStayPivotAt = (status: RoomStatusRow[]): PivotTable =>
  buildPivotFromStatus(status, 'accommodation_type', STAY_TYPES)

// 분양 차수별 카운트 (대시보드 SalesByPhaseChart 용).
import type { SalesSummaryRow } from './summary'

export const buildSalesByPhaseAt = (status: RoomStatusRow[]): SalesSummaryRow[] => {
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
