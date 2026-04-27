// 계약기간 만료 객실수 (/summary/expiry) - Phase 17
// ?days=N (기본 90) 이내에 임대종료/운영종료가 도래하는 계약 목록.

import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getExpirySummary } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import ExpiryTable from './ExpiryTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default async function SummaryExpiryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const daysRaw = Array.isArray(searchParams.days) ? searchParams.days[0] : searchParams.days
  const days = daysRaw ? Math.max(-365, Math.min(365, Number(daysRaw))) : 90
  const supabase = createServerSupabase()
  const rows = await getExpirySummary(supabase, days)
  
  // 계약 수정 폼용 바이어 목록 조회
  const { data: buyersData } = await supabase
    .from('buyers')
    .select('id, name1, buyer_no')
    .order('buyer_no')
  const buyers = (buyersData ?? []) as { id: string; name1: string; buyer_no: string }[]

  const isPast = days < 0
  const descriptionText = isPast
    ? `최근 ${Math.abs(days)}일 전부터 오늘까지 운영이 종료된 객실 (총 ${rows.length}건)`
    : `오늘부터 향후 ${days}일 이내에 운영이 종료될 예정인 객실 (총 ${rows.length}건)`

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="운영종료(만료) 객실 현황"
        description={descriptionText}
      />
      <div className="flex flex-wrap gap-2 text-xs">
        {[-90, -60, -30, -14, -7, 7, 14, 30, 60, 90, 180, 365].map((d) => (
          <Link
            key={d}
            href={`/summary/expiry?days=${d}`}
            className={`rounded-full border px-3 py-1 font-medium transition-colors ${
              d === days 
                ? (d < 0 ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-primary bg-primary text-primary-foreground') 
                : 'hover:bg-muted'
            }`}
          >
            {d > 0 ? `+${d}일` : `${d}일`}
          </Link>
        ))}
      </div>
      
      <ExpiryTable 
        rows={rows} 
        buyers={buyers} 
        emptyMessage={isPast ? `최근 ${Math.abs(days)}일 이내에 만료된 계약이 없습니다.` : `향후 ${days}일 이내 만료 예정인 계약이 없습니다.`}
      />
    </div>
  )
}
