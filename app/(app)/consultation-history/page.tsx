// 상담내역 (/consultation-history) - Phase 14
// 조회 전용. 등록/수정은 /consultations 에서.

import { createServerSupabase } from '@/lib/supabase/server'
import { listConsultations, type ConsultationFilter } from '@/lib/queries/consultations'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'

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

export default async function ConsultationHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listConsultations(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="상담내역"
        description="과거 상담 내역을 시간순으로 조회합니다 (조회 전용)."
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">상담일</th>
              <th className="px-3 py-2 text-left">계약자</th>
              <th className="px-3 py-2 text-left">채널</th>
              <th className="px-3 py-2 text-left">제목</th>
              <th className="px-3 py-2 text-left">상담자</th>
              <th className="px-3 py-2 text-left">결과</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20 align-top">
                <td className="px-3 py-2 font-mono">{formatDate(r.consult_date)}</td>
                <td className="px-3 py-2 font-medium">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{r.channel ?? '-'}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.title ?? '-'}</div>
                  {r.content && (
                    <div className="mt-1 max-w-md whitespace-pre-wrap text-xs text-muted-foreground">
                      {r.content}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">{r.consultant ?? '-'}</td>
                <td className="px-3 py-2 max-w-sm whitespace-pre-wrap text-xs">{r.result ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="상담 내역이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
