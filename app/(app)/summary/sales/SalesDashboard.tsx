'use client'

// 분양 요약 페이지 하단 대시보드.
// - 차수별 분양 현황 (누적 막대): 계약 / 미계약
// - 운영방식 분포 (도넛): 위탁/직영/미계약 비율
// - 숙박형태별 숙박료 합계 (가로 막대): 매출 비중 비교
//
// 데이터는 서버 페이지에서 받은 pivot 결과(opPivot, rentPivot) 와
// 클라이언트에서 추가 가져온 SalesSummaryRow[] 를 그대로 변환해 사용.

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
  LabelList,
} from 'recharts'
import type { PivotTable, RentPivotTable, SalesSummaryRow } from '@/lib/queries/summary'
import { formatCurrency } from '@/lib/utils/format'

const PALETTE = [
  '#2563eb', '#16a34a', '#f59e0b', '#dc2626',
  '#7c3aed', '#0891b2', '#db2777', '#475569',
]

type Props = {
  salesByPhase: SalesSummaryRow[]
  opPivot: PivotTable
  rentPivot: RentPivotTable
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="inline-flex h-6 w-1 rounded bg-primary" />
    <h2 className="text-lg font-bold tracking-tight">{children}</h2>
  </div>
)

// ① 차수별 분양 현황 누적 막대.
const SalesByPhaseChart = ({ rows }: { rows: SalesSummaryRow[] }) => {
  const data = rows.map((r) => ({
    phase: `${r.phase}차`,
    계약: r.sold,
    미계약: r.available,
  }))
  const total = rows.reduce((s, r) => s + r.total, 0)
  const sold = rows.reduce((s, r) => s + r.sold, 0)
  const rate = total > 0 ? Math.round((sold / total) * 100) : 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">차수별 분양 현황</h3>
        <span className="text-xs text-muted-foreground">
          전체 계약률 <span className="font-bold text-foreground">{rate}%</span>
          <span className="ml-1">({sold} / {total})</span>
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="계약" stackId="a" fill="#2563eb" />
            <Bar dataKey="미계약" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ② 운영방식 분포 도넛.
const OperationDonut = ({ pivot }: { pivot: PivotTable }) => {
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
        <h3 className="text-sm font-semibold">운영방식 분포</h3>
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
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ③ 숙박형태별 숙박료 합계 가로 막대.
const RentByStayBar = ({ pivot }: { pivot: RentPivotTable }) => {
  const data = pivot.columns
    .map((c, i) => ({
      name: c.replace('_', ' '),
      rent: pivot.colTotals[c]?.rent ?? 0,
      count: pivot.colTotals[c]?.count ?? 0,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((d) => d.rent > 0)
    .sort((a, b) => b.rent - a.rent)

  const total = data.reduce((s, d) => s + d.rent, 0)

  return (
    <div className="rounded-lg border bg-card p-4 lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">숙박형태별 숙박료 합계</h3>
        <span className="text-xs text-muted-foreground">
          합계 <span className="font-bold text-foreground">{formatCurrency(total)}</span>원
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          데이터가 없습니다.
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 60, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v, _n, p) => [
                  `${formatCurrency(Number(v))}원 (${(p as { payload: { count: number } }).payload.count}실)`,
                  '숙박료',
                ]}
              />
              <Bar dataKey="rent" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="rent"
                  position="right"
                  formatter={(v) => formatCurrency(Number(v))}
                  style={{ fontSize: 11, fill: '#475569' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default function SalesDashboard({ salesByPhase, opPivot, rentPivot }: Props) {
  return (
    <section className="space-y-3">
      <SectionTitle>대시보드</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByPhaseChart rows={salesByPhase} />
        <OperationDonut pivot={opPivot} />
        <RentByStayBar pivot={rentPivot} />
      </div>
    </section>
  )
}
