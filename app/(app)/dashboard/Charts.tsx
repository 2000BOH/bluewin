'use client'

// 대시보드 차트 모듈 (Recharts 기반).
// - 차수별 분양 현황 (누적 막대): 객실수 = 계약 + 미계약
// - 민원 상태별 분포 (도넛)
// - 월별 신규 계약 추이 (라인)
//
// 모두 'use client' 가 필요한 라이브러리이므로 별도 파일로 분리.

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
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import type { SalesSummaryRow, StatusDistRow, MonthlyContractRow } from '@/lib/queries/summary'

// shadcn 톤에 맞춘 정돈된 팔레트.
const PALETTE = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#f59e0b', // amber-500
  '#dc2626', // red-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
  '#db2777', // pink-600
  '#475569', // slate-600
]

const STATUS_COLOR: Record<string, string> = {
  접수: '#3b82f6',
  영선: '#f97316',
  외부업체: '#8b5cf6',
  퇴실: '#6b7280',
  청소: '#06b6d4',
  완료: '#10b981',
}

// ============================================================================
// 1. 차수별 분양 현황 (누적 막대)
// ============================================================================
type SalesProps = { rows: SalesSummaryRow[] }

export function SalesByPhaseChart({ rows }: SalesProps) {
  const data = rows.map((r) => ({
    phase: `${r.phase}차`,
    계약: r.sold,
    미계약: r.available,
    rate: r.total > 0 ? Math.round((r.sold / r.total) * 100) : 0,
  }))
  const total = rows.reduce((s, r) => s + r.total, 0)
  const sold = rows.reduce((s, r) => s + r.sold, 0)
  const overallRate = total > 0 ? Math.round((sold / total) * 100) : 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">차수별 분양 현황</h2>
        <span className="text-xs text-muted-foreground">
          전체 계약률 <span className="font-bold text-foreground">{overallRate}%</span>
          <span className="ml-1 text-muted-foreground">({sold} / {total})</span>
        </span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value}실`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="계약" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
            <Bar dataKey="미계약" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================================
// 2. 민원 상태별 분포 (도넛)
// ============================================================================
type StatusProps = { rows: StatusDistRow[] }

export function MaintenanceStatusDonut({ rows }: StatusProps) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  const data = rows
    .filter((r) => r.count > 0)
    .map((r) => ({ name: r.status, value: r.count, color: STATUS_COLOR[r.status] ?? '#94a3b8' }))

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">민원 상태별 분포</h2>
        <span className="text-xs text-muted-foreground">
          전체 <span className="font-bold text-foreground">{total}</span>건
        </span>
      </div>
      {total === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          민원 데이터가 없습니다.
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
                contentStyle={{
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
                formatter={(value, name) => [`${value}건`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 3. 월별 신규 계약 추이 (라인)
// ============================================================================
type MonthlyProps = { rows: MonthlyContractRow[] }

export function MonthlyContractsLine({ rows }: MonthlyProps) {
  const data = rows.map((r) => ({
    month: r.month.slice(5), // 'YYYY-MM' → 'MM'
    full: r.month,
    count: r.count,
  }))
  const total = rows.reduce((s, r) => s + r.count, 0)
  const peak = rows.reduce((m, r) => Math.max(m, r.count), 0)

  return (
    <div className="rounded-lg border bg-card p-4 lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">월별 신규 계약 추이 (최근 12개월)</h2>
        <span className="text-xs text-muted-foreground">
          누적 <span className="font-bold text-foreground">{total}</span>건 · 최대 {peak}건/월
        </span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
              formatter={(value) => [`${value}건`, '신규 계약']}
              labelFormatter={(label) => {
                const item = data.find((d) => d.month === label)
                return item ? item.full : label
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// 팔레트는 다른 차트에서도 재사용 가능하도록 export.
export { PALETTE }
