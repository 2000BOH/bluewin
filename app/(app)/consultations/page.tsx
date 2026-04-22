// 상담관리 (/consultations) - Phase 14
// 상담 기록의 등록/수정/삭제 + 검색 필터.

import { createServerSupabase } from '@/lib/supabase/server'
import { listConsultations, type ConsultationFilter } from '@/lib/queries/consultations'
import { listBuyers } from '@/lib/queries/buyers'
import PageHeader from '@/components/common/PageHeader'
import ConsultationTable from './ConsultationTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): ConsultationFilter => ({
  buyerName: pickStr(params.buyer_name),
  channel: pickStr(params.channel),
  from: pickStr(params.from),
  to: pickStr(params.to),
  q: pickStr(params.q),
})

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const [rows, buyers] = await Promise.all([
    listConsultations(supabase, buildFilter(searchParams)),
    listBuyers(supabase, {}),
  ])
  const buyerOpts = buyers.map((b) => ({ id: b.id, name1: b.name1, buyer_no: b.buyer_no }))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader title="상담관리" description="수분양자 상담 기록을 관리합니다." />
      <ConsultationTable rows={rows} buyers={buyerOpts} />
    </div>
  )
}
