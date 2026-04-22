// 계약기간 만료 객실수 (/summary/expiry) - Phase 17
// ?days=N (기본 90) 이내에 임대종료/운영종료가 도래하는 계약 목록.

import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getExpirySummary } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default async function SummaryExpiryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const daysRaw = Array.isArray(searchParams.days) ? searchParams.days[0] : searchParams.days
  const days = daysRaw ? Math.max(1, Math.min(365, Number(daysRaw))) : 90
  const supabase = createServerSupabase()
  const rows = await getExpirySummary(supabase, days)
  const expired = rows.filter((r) => r.days_left < 0).length
  const upcoming = rows.length - expired

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="계약기간 만료 객실수"
        description={`향후 ${days}일 이내 만료 ${upcoming}건 / 이미 만료 ${expired}건`}
      />
      <div className="flex flex-wrap gap-2 text-xs">
        {[30, 60, 90, 180, 365].map((d) => (
          <Link
            key={d}
            href={`/summary/expiry?days=${d}`}
            className={`rounded-full border px-3 py-1 ${
              d === days ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {d}일
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">계약자</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">종료종류</th>
              <th className="px-3 py-2 text-left">종료일</th>
              <th className="px-3 py-2 text-right">D-Day</th>
              <th className="px-3 py-2 text-left">바로가기</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.contract_id}-${r.end_kind}`} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                <td className="px-3 py-2">{r.end_kind}</td>
                <td className="px-3 py-2 font-mono">{formatDate(r.end_date)}</td>
                <td
                  className={`px-3 py-2 text-right font-mono ${
                    r.days_left < 0
                      ? 'text-destructive'
                      : r.days_left <= 30
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {r.days_left < 0 ? `D+${Math.abs(r.days_left)}` : `D-${r.days_left}`}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/contracts/${r.contract_id}`} className="text-primary hover:underline">
                    상세
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description={`향후 ${days}일 이내 만료 예정인 계약이 없습니다.`} />
          </div>
        )}
      </div>
    </div>
  )
}
