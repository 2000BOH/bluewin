// 수분양자마스터 (/buyers) - Phase 10

import { createServerSupabase } from '@/lib/supabase/server'
import { listBuyers, getBuyerContractCounts, type BuyerFilter } from '@/lib/queries/buyers'
import PageHeader from '@/components/common/PageHeader'
import BuyerTable from './BuyerTable'
import type { BuyerType } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): BuyerFilter => {
  const phase = pickStr(params.phase)
  const type = pickStr(params.buyer_type)
  return {
    buyerNo: pickStr(params.buyer_no),
    buyerType: type === '개인' || type === '법인' ? (type as BuyerType) : null,
    name: pickStr(params.name),
    phase: phase ? Number(phase) : null,
    roomNo: pickStr(params.room_no),
  }
}

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listBuyers(supabase, buildFilter(searchParams))
  const counts = await getBuyerContractCounts(supabase, rows.map((r) => r.id))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="수분양자마스터"
        description="블루오션 레지던스 수분양자(계약자) 정보를 관리합니다."
      />
      <BuyerTable rows={rows} counts={counts} />
    </div>
  )
}
