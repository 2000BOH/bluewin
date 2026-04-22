// 운영숙박 Summary (/summary/operation) - Phase 16
// 운영방식 + 숙박형태 조합별 계약 수 집계.

import { createServerSupabase } from '@/lib/supabase/server'
import { getOperationSummary } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'

export const dynamic = 'force-dynamic'

export default async function SummaryOperationPage() {
  const supabase = createServerSupabase()
  const rows = await getOperationSummary(supabase)
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="운영숙박 Summary"
        description={`운영방식 × 숙박형태 조합별 계약 분포 (총 ${total}건)`}
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">운영방식</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-right">계약수</th>
              <th className="px-3 py-2 text-right">비중</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.operation_type}|${r.accommodation_type}`} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{r.operation_type}</td>
                <td className="px-3 py-2">{r.accommodation_type}</td>
                <td className="px-3 py-2 text-right font-mono">{r.count}</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                  {total > 0 ? `${Math.round((r.count / total) * 100)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="집계할 계약이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
