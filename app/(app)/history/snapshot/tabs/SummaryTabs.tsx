'use client'

// 히스토리 보기 — 분양 요약 / 숙박 요약 통합 탭.
// 라이브 페이지의 대시보드 컴포넌트(SalesDashboard / OperationDashboard)를 재사용.

import { Fragment, useState } from 'react'
import type { PivotTable, RentPivotTable, SalesSummaryRow } from '@/lib/queries/summary'
import { formatCurrency } from '@/lib/utils/format'
import EmptyState from '@/components/common/EmptyState'
import SalesDashboard from '@/app/(app)/summary/sales/SalesDashboard'
import OperationDashboard from '@/app/(app)/summary/operation/OperationDashboard'

type TopTab = 'sales' | 'operation'

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
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">차수</th>
              {pivot.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {c.replace('_', ' ')}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-primary/5">Total</th>
            </tr>
          </thead>
          <tbody>
            {pivot.phases.map((p) => (
              <tr key={p} className="border-b">
                <td className="px-3 py-2 font-medium">{p}차</td>
                {pivot.columns.map((c) => {
                  const v = pivot.cells[p]?.[c] ?? 0
                  return (
                    <td key={c} className={`px-3 py-2 text-right font-mono ${v === 0 ? 'text-muted-foreground/40' : ''}`}>
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
              <td className="px-3 py-2 font-bold">Total</td>
              {pivot.columns.map((c) => (
                <td key={c} className="px-3 py-2 text-right font-mono font-bold">
                  {(pivot.colTotals[c] ?? 0).toLocaleString()}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-mono font-bold bg-primary/10 text-primary">
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
            <tr className="border-b bg-muted/40">
              <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium align-bottom">차수</th>
              {pivot.columns.map((c) => (
                <th key={c} colSpan={2} className="px-3 py-2 text-center text-xs font-semibold border-l whitespace-nowrap">
                  {c.replace('_', ' ')}
                </th>
              ))}
              <th colSpan={2} className="px-3 py-2 text-center text-xs font-semibold border-l bg-primary/5 whitespace-nowrap">Total</th>
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
              <tr key={p} className="border-b">
                <td className="px-3 py-2 font-medium">{p}차</td>
                {pivot.columns.map((c) => {
                  const v = pivot.cells[p]?.[c] ?? { count: 0, rent: 0 }
                  return (
                    <Fragment key={c}>
                      <td className={`px-2 py-2 text-right font-mono border-l ${v.count === 0 ? 'text-muted-foreground/40' : ''}`}>
                        {v.count === 0 ? '' : v.count.toLocaleString()}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${v.rent === 0 ? 'text-muted-foreground/40' : ''}`}>
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
              <td className="px-3 py-2 font-bold">Total</td>
              {pivot.columns.map((c) => {
                const v = pivot.colTotals[c] ?? { count: 0, rent: 0 }
                return (
                  <Fragment key={c}>
                    <td className="px-2 py-2 text-right font-mono font-bold border-l">{v.count.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono font-bold">{formatCurrency(v.rent)}</td>
                  </Fragment>
                )
              })}
              <td className="px-2 py-2 text-right font-mono font-bold border-l bg-primary/10 text-primary">
                {pivot.grandTotal.count.toLocaleString()}
              </td>
              <td className="px-2 py-2 text-right font-mono font-bold bg-primary/10 text-primary">
                {formatCurrency(pivot.grandTotal.rent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

type Props = {
  opPivot: PivotTable
  stayPivot: PivotTable
  rentPivot: RentPivotTable
  salesByPhase: SalesSummaryRow[]
}

export default function SummaryTabs({ opPivot, stayPivot, rentPivot, salesByPhase }: Props) {
  const [tab, setTab] = useState<TopTab>('sales')

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="-mb-px flex gap-1">
          {(
            [
              { k: 'sales', label: '분양 요약', sub: '운영방식·숙박형태·숙박료' },
              { k: 'operation', label: '숙박 요약', sub: '차수 × 숙박형태' },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`flex flex-col items-start border-b-2 px-5 py-2.5 text-sm font-medium transition ${
                tab === t.k
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[11px] text-muted-foreground/70 font-normal">{t.sub}</span>
            </button>
          ))}
        </nav>
      </div>

      {tab === 'sales' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionTitle badge={`${opPivot.grandTotal.toLocaleString()}실`}>운영방식</SectionTitle>
            <PivotCountTable pivot={opPivot} title="운영방식" />
          </section>
          <section className="space-y-3">
            <SectionTitle badge={`${stayPivot.grandTotal.toLocaleString()}실`}>숙박형태</SectionTitle>
            <PivotCountTable pivot={stayPivot} title="숙박형태" />
          </section>
          <section className="space-y-3">
            <SectionTitle
              badge={`${rentPivot.grandTotal.count.toLocaleString()}실 / ${formatCurrency(rentPivot.grandTotal.rent)}원`}
            >
              숙박료
            </SectionTitle>
            <RentPivotTableComp pivot={rentPivot} />
          </section>

          <SalesDashboard salesByPhase={salesByPhase} opPivot={opPivot} rentPivot={rentPivot} />
        </div>
      )}

      {tab === 'operation' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionTitle badge={`${stayPivot.grandTotal.toLocaleString()}실`}>차수별 숙박형태 분포</SectionTitle>
            <PivotCountTable pivot={stayPivot} title="숙박형태" />
          </section>
          <OperationDashboard summary={stayPivot} />
        </div>
      )}
    </div>
  )
}
