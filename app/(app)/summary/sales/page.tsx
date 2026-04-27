// 분양관리 Summary (/summary/sales) - Phase 18 (재설계)
// 3개 표 누적 표시:
//   ① 운영방식: 차수 × 운영방식 (객실 수 + Total)
//   ② 숙박형태: 차수 × 숙박형태 (객실 수 + Total)
//   ③ 숙박료:  차수 × 숙박형태 (객실 수 + 숙박료 합계 + Total)

import { Fragment } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getOperationByPhasePivot,
  getStayByPhasePivot,
  getRentByStayPivot,
  type PivotTable,
  type RentPivotTable,
} from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

const SectionTitle = ({ children, badge }: { children: React.ReactNode; badge?: string }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex h-6 w-1 rounded bg-primary" />
    <h2 className="text-lg font-bold tracking-tight">{children}</h2>
    {badge && (
      <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
        {badge}
      </span>
    )}
  </div>
)

const PivotCountTable = ({ pivot, title }: { pivot: PivotTable; title: string }) => {
  if (pivot.phases.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <EmptyState description={`${title} 데이터가 없습니다.`} />
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gradient-to-b from-muted/60 to-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2.5 text-left font-medium sticky left-0 bg-muted/60 z-10">차수</th>
              {pivot.columns.map((c) => (
                <th key={c} className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                  {c.replace('_', ' ')}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap bg-primary/5">Total</th>
            </tr>
          </thead>
          <tbody>
            {pivot.phases.map((p) => (
              <tr key={p} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 font-medium sticky left-0 bg-card z-10">{p}차</td>
                {pivot.columns.map((c) => {
                  const v = pivot.cells[p]?.[c] ?? 0
                  return (
                    <td
                      key={c}
                      className={`px-3 py-2 text-right font-mono ${v === 0 ? 'text-muted-foreground/40' : ''}`}
                    >
                      {v === 0 ? '' : v.toLocaleString()}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right font-mono font-semibold bg-primary/5">
                  {pivot.rowTotals[p].toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-muted/40 text-sm">
              <td className="px-3 py-2.5 font-bold">Total</td>
              {pivot.columns.map((c) => {
                const v = pivot.colTotals[c] ?? 0
                return (
                  <td key={c} className="px-3 py-2.5 text-right font-mono font-bold">
                    {v.toLocaleString()}
                  </td>
                )
              })}
              <td className="px-3 py-2.5 text-right font-mono font-bold bg-primary/10 text-primary">
                {pivot.grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const RentPivotTableComp = ({ pivot }: { pivot: RentPivotTable }) => {
  if (pivot.phases.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <EmptyState description="임대료 집계 대상 계약이 없습니다." />
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gradient-to-b from-muted/60 to-muted/30">
              <th rowSpan={2} className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/60 z-10 align-bottom">
                차수
              </th>
              {pivot.columns.map((c) => (
                <th
                  key={c}
                  colSpan={2}
                  className="px-3 py-2 text-center text-xs font-semibold border-l whitespace-nowrap"
                >
                  {c.replace('_', ' ')}
                </th>
              ))}
              <th colSpan={2} className="px-3 py-2 text-center text-xs font-semibold border-l bg-primary/5 whitespace-nowrap">
                Total
              </th>
            </tr>
            <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
              {pivot.columns.map((c) => (
                <Fragment key={c}>
                  <th className="px-2 py-1.5 text-right font-medium border-l">객실수</th>
                  <th className="px-2 py-1.5 text-right font-medium">숙박료</th>
                </Fragment>
              ))}
              <th className="px-2 py-1.5 text-right font-semibold border-l bg-primary/5">객실수</th>
              <th className="px-2 py-1.5 text-right font-semibold bg-primary/5">숙박료</th>
            </tr>
          </thead>
          <tbody>
            {pivot.phases.map((p) => (
              <tr key={p} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 font-medium sticky left-0 bg-card z-10">{p}차</td>
                {pivot.columns.map((c) => {
                  const v = pivot.cells[p]?.[c] ?? { count: 0, rent: 0 }
                  return (
                    <Fragment key={c}>
                      <td
                        className={`px-2 py-2 text-right font-mono border-l ${v.count === 0 ? 'text-muted-foreground/40' : ''}`}
                      >
                        {v.count === 0 ? '' : v.count.toLocaleString()}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-mono ${v.rent === 0 ? 'text-muted-foreground/40' : ''}`}
                      >
                        {v.rent === 0 ? '' : formatCurrency(v.rent)}
                      </td>
                    </Fragment>
                  )
                })}
                <td className="px-2 py-2 text-right font-mono font-semibold border-l bg-primary/5">
                  {pivot.rowTotals[p].count.toLocaleString()}
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold bg-primary/5">
                  {formatCurrency(pivot.rowTotals[p].rent)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-muted/40">
              <td className="px-3 py-2.5 font-bold">Total</td>
              {pivot.columns.map((c) => {
                const v = pivot.colTotals[c] ?? { count: 0, rent: 0 }
                return (
                  <Fragment key={c}>
                    <td className="px-2 py-2.5 text-right font-mono font-bold border-l">
                      {v.count.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono font-bold">
                      {formatCurrency(v.rent)}
                    </td>
                  </Fragment>
                )
              })}
              <td className="px-2 py-2.5 text-right font-mono font-bold border-l bg-primary/10 text-primary">
                {pivot.grandTotal.count.toLocaleString()}
              </td>
              <td className="px-2 py-2.5 text-right font-mono font-bold bg-primary/10 text-primary">
                {formatCurrency(pivot.grandTotal.rent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default async function SummarySalesPage() {
  const supabase = createServerSupabase()
  const [opPivot, stayPivot, rentPivot] = await Promise.all([
    getOperationByPhasePivot(supabase),
    getStayByPhasePivot(supabase),
    getRentByStayPivot(supabase),
  ])

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="분양관리 Summary"
        description="객실 기준 차수별 운영방식·숙박형태·숙박료 집계 (계약된 객실은 계약 정보, 미계약은 '미계약' 컬럼으로 표시)"
      />

      <section className="space-y-3">
        <SectionTitle badge={`${opPivot.grandTotal.toLocaleString()}실`}>운영방식</SectionTitle>
        <PivotCountTable pivot={opPivot} title="운영방식" />
      </section>

      <section className="space-y-3">
        <SectionTitle badge={`${stayPivot.grandTotal.toLocaleString()}실`}>숙박형태</SectionTitle>
        <PivotCountTable pivot={stayPivot} title="숙박형태" />
      </section>

      <section className="space-y-3">
        <SectionTitle badge={`${rentPivot.grandTotal.count.toLocaleString()}실 / ${formatCurrency(rentPivot.grandTotal.rent)}원`}>
          숙박료
        </SectionTitle>
        <p className="text-xs text-muted-foreground">
          ※ 임대 가능한 숙박형태(인스파이어·장박·호텔·기숙사) 만 집계됩니다. 숙박료는 임대료(없으면 확정지급액) 합계.
        </p>
        <RentPivotTableComp pivot={rentPivot} />
      </section>
    </div>
  )
}
