// 집계용 쿼리 모음. 분양/운영/만료/객실현황 Summary 페이지에서 사용.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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
