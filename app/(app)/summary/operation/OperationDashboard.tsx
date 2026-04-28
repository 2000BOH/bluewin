'use client'

// 숙박 요약 페이지 Summary 탭 하단 대시보드.
// - 숙박형태 분포 (도넛): 인스파이어/장박/호텔/기숙사/공실 등 비중
// - 차수별 숙박형태 누적 막대: 차수별 구성 비교
//
// summary(PivotTable) 데이터를 그대로 변환해 사용.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { PivotTable } from '@/lib/queries/summary'

const PALETTE = [
  '#2563eb', '#16a34a', '#f59e0b', '#dc2626',
  '#7c3aed', '#0891b2', '#db2777', '#475569',
  '#65a30d', '#ea580c', '#0284c7',
]

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex h-6 w-1 rounded bg-primary" />
    <h2 className="text-lg font-bold tracking-tight">{children}</h2>
  </div>
)

// ① 숙박형태 분포 도넛.
const StayDonut = ({ pivot }: { pivot: PivotTable }) => {
  const data = pivot.columns
    .map((c, i) => ({
      name: c.replace('_', ' '),
      value: pivot.colTotals[c] ?? 0,
      color: c === '미계약' ? '#cbd5e1' : PALETTE[i % PALETTE.length],
    }))
    .filter((d) => d.value > 0)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">숙박형태 분포</h3>
        <span className="text-xs text-muted-foreground">
          전체 <span className="font-bold text-foreground">{total}</span>실
        </span>
      </div>
      {total === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          데이터가 없습니다.
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                label={({ percent }) =>
                  percent && percent > 0.05 ? `${Math.round(percent * 100)}%` : ''
                }
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v, n) => [`${v}실`, String(n)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ② 차수별 숙박형태 누적 막대.
const StayByPhaseStacked = ({ pivot }: { pivot: PivotTable }) => {
  const data = pivot.phases.map((p) => {
    const row: Record<string, number | string> = { phase: `${p}차` }
    for (const c of pivot.columns) {
      row[c.replace('_', ' ')] = pivot.cells[p]?.[c] ?? 0
    }
    return row
  })
  const cols = pivot.columns.map((c, i) => ({
    key: c.replace('_', ' '),
    raw: c,
    color: c === '미계약' ? '#cbd5e1' : PALETTE[i % PALETTE.length],
  }))

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">차수별 숙박형태 구성</h3>
        <span className="text-xs text-muted-foreground">
          전체 <span className="font-bold text-foreground">{pivot.grandTotal}</span>실
        </span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v, n) => [`${v}실`, String(n)]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {cols.map((c, i) => (
              <Bar
                key={c.key}
                dataKey={c.key}
                stackId="a"
                fill={c.color}
                radius={i === cols.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function OperationDashboard({ summary }: { summary: PivotTable }) {
  return (
    <section className="space-y-3">
      <SectionTitle>대시보드</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StayDonut pivot={summary} />
        <StayByPhaseStacked pivot={summary} />
      </div>
    </section>
  )
}
