// 분양관리 Summary (/summary/sales) - Phase 18
// 차수별 총실/계약/미계약 + 분양가 합계.

import { createServerSupabase } from '@/lib/supabase/server'
import { getSalesSummary } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function SummarySalesPage() {
  const supabase = createServerSupabase()
  const rows = await getSalesSummary(supabase)
  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      sold: acc.sold + r.sold,
      available: acc.available + r.available,
      vat_excl: acc.vat_excl + r.sale_price_excl_vat,
      vat_incl: acc.vat_incl + r.sale_price_incl_vat,
    }),
    { total: 0, sold: 0, available: 0, vat_excl: 0, vat_incl: 0 },
  )

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader title="분양관리 Summary" description="차수별 분양 현황 집계" />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-right">총실</th>
              <th className="px-3 py-2 text-right">계약</th>
              <th className="px-3 py-2 text-right">미계약</th>
              <th className="px-3 py-2 text-right">계약률</th>
              <th className="px-3 py-2 text-right">분양가합계 (VAT 제외)</th>
              <th className="px-3 py-2 text-right">분양가합계 (VAT 포함)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.phase} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-medium">{r.phase}차</td>
                <td className="px-3 py-2 text-right font-mono">{r.total}</td>
                <td className="px-3 py-2 text-right font-mono text-green-700">{r.sold}</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">{r.available}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.total > 0 ? `${Math.round((r.sold / r.total) * 100)}%` : '-'}
                </td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sale_price_excl_vat)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sale_price_incl_vat)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-muted/30">
              <tr className="border-t-2 text-sm">
                <td className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{totals.total}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-green-700">{totals.sold}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{totals.available}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {totals.total > 0 ? `${Math.round((totals.sold / totals.total) * 100)}%` : '-'}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(totals.vat_excl)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(totals.vat_incl)}</td>
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="집계할 객실이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
