'use client'

// 숙박 요약 Summary / Detail 탭 전환.

import { Fragment, useState } from 'react'
import type { PivotTable, OperationDetailTable } from '@/lib/queries/summary'
import OperationDashboard from './OperationDashboard'

type TabKey = 'summary' | 'detail'

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex h-6 w-1 rounded bg-primary" />
    <h2 className="text-lg font-bold tracking-tight">{children}</h2>
  </div>
)

const SummaryTable = ({ pivot }: { pivot: PivotTable }) => (
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
          <tr className="border-t-2 bg-muted/40">
            <td className="px-3 py-2.5 font-bold">Total</td>
            {pivot.columns.map((c) => (
              <td key={c} className="px-3 py-2.5 text-right font-mono font-bold">
                {(pivot.colTotals[c] ?? 0).toLocaleString()}
              </td>
            ))}
            <td className="px-3 py-2.5 text-right font-mono font-bold bg-primary/10 text-primary">
              {pivot.grandTotal.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)

const DetailTable = ({ table }: { table: OperationDetailTable }) => {
  // 차수별 그룹 — 각 그룹의 마지막 행에 소계 행 삽입.
  const grouped = new Map<number, typeof table.rows>()
  for (const r of table.rows) {
    if (!grouped.has(r.phase)) grouped.set(r.phase, [])
    grouped.get(r.phase)!.push(r)
  }
  const phases = Array.from(grouped.keys()).sort((a, b) => a - b)

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gradient-to-b from-muted/60 to-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2.5 text-left font-medium sticky left-0 bg-muted/60 z-10">차수</th>
              <th className="px-3 py-2.5 text-left font-medium sticky left-[3.5rem] bg-muted/60 z-10">숙박형태</th>
              {table.columns.map((c) => (
                <th key={c} className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                  {c.replace('_', ' ')}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap bg-primary/5">Total</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((p) => {
              const rows = grouped.get(p) ?? []
              const sub = table.phaseSubtotals[p]
              return (
                <Fragment key={p}>
                  {rows.map((r, idx) => (
                    <tr
                      key={`${p}-${r.stay_type}`}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      {idx === 0 ? (
                        <td
                          rowSpan={rows.length}
                          className="px-3 py-2 font-bold align-top sticky left-0 bg-card z-10 border-r border-r-muted"
                        >
                          {p}차
                        </td>
                      ) : null}
                      <td className="px-3 py-2 sticky left-[3.5rem] bg-card z-10">
                        {r.stay_type.replace('_', ' ')}
                      </td>
                      {table.columns.map((c) => {
                        const v = r.cells[c] ?? 0
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
                        {r.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr key={`${p}-subtotal`} className="border-y-2 bg-muted/40 text-sm">
                    <td className="px-3 py-2 font-bold sticky left-0 bg-muted/40 z-10" />
                    <td className="px-3 py-2 font-bold sticky left-[3.5rem] bg-muted/40 z-10">
                      {p}차 Total
                    </td>
                    {table.columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-right font-mono font-bold">
                        {(sub.cells[c] ?? 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-mono font-bold bg-primary/10 text-primary">
                      {sub.total.toLocaleString()}
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-primary/5">
              <td className="px-3 py-2.5 font-bold sticky left-0 bg-primary/5 z-10" colSpan={2}>
                Grand Total
              </td>
              {table.columns.map((c) => (
                <td key={c} className="px-3 py-2.5 text-right font-mono font-bold">
                  {(table.colTotals[c] ?? 0).toLocaleString()}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-mono font-bold bg-primary/15 text-primary">
                {table.grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

type Props = {
  summary: PivotTable
  detail: OperationDetailTable
}

export default function OperationTabs({ summary, detail }: Props) {
  const [tab, setTab] = useState<TabKey>('summary')

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="-mb-px flex gap-1">
          {([
            { k: 'summary', label: 'Summary', sub: '차수 × 숙박형태' },
            { k: 'detail', label: 'Detail', sub: '차수 × 숙박형태 × 운영방식' },
          ] as const).map((t) => (
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

      {tab === 'summary' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionHeading>차수별 숙박형태 분포</SectionHeading>
            <SummaryTable pivot={summary} />
          </section>
          <OperationDashboard summary={summary} />
        </div>
      )}

      {tab === 'detail' && (
        <section className="space-y-3">
          <SectionHeading>차수 × 숙박형태 × 운영방식</SectionHeading>
          <p className="text-xs text-muted-foreground">
            ※ 객실 기준. 차수별 행 그룹의 마지막에 소계가 표시됩니다.
          </p>
          <DetailTable table={detail} />
        </section>
      )}
    </div>
  )
}
