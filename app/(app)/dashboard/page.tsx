// 대시보드 — 실데이터 기반 KPI + 위젯.
// 서버 컴포넌트에서 병렬 쿼리로 필요한 집계를 한 번에 가져온다.
// 모바일(≤640px)에서도 한 화면에 들어오도록 grid 단위 조정.

import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getMaintenanceStatusCounts,
  getRnrCounts,
  getContractTotal,
  getExpiringContractCount,
  getRecentInbox,
  getExpiringContracts,
} from '@/lib/queries/dashboard'
import {
  getSalesSummary,
  getMaintenanceStatusDist,
  getMonthlyNewContracts,
} from '@/lib/queries/summary'
import {
  SalesByPhaseChart,
  MaintenanceStatusDonut,
  MonthlyContractsLine,
} from './Charts'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { COMMON_STATUSES, RNR_STAFF_NOS, RNR_STAFF_MAPPING, type RnrStaffNo } from '@/types/status'
import type { RnrStaffNoEnum } from '@/types/supabase'
import {
  ClipboardList,
  FileText,
  CalendarClock,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  const [
    statusCounts,
    rnrCounts,
    contractTotal,
    expiringCount,
    recentInbox,
    expiringContracts,
    salesSummary,
    statusDist,
    monthlyContracts,
  ] = await Promise.all([
    getMaintenanceStatusCounts(supabase),
    getRnrCounts(supabase),
    getContractTotal(supabase),
    getExpiringContractCount(supabase, 90),
    getRecentInbox(supabase, 5),
    getExpiringContracts(supabase, 90, 5),
    getSalesSummary(supabase),
    getMaintenanceStatusDist(supabase),
    getMonthlyNewContracts(supabase, 12),
  ])
  const totalMaintenance = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">Bluewin 대시보드</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          분양 + 객실·영선 통합 관리 시스템. 주요 지표를 한눈에 확인합니다.
        </p>
      </header>

      {/* KPI 카드 */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="총 계약"
          value={contractTotal}
          unit="건"
          href="/contracts"
          icon={<FileText className="h-4 w-4" />}
          accent="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
        />
        <KpiCard
          label="전체 민원"
          value={totalMaintenance}
          unit="건"
          href="/maintenance"
          icon={<ClipboardList className="h-4 w-4" />}
          accent="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        />
        <KpiCard
          label="접수 대기"
          value={statusCounts['접수']}
          unit="건"
          href="/maintenance/inbox"
          icon={<Users className="h-4 w-4" />}
          accent="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          highlight={statusCounts['접수'] > 0}
        />
        <KpiCard
          label="90일 내 만료"
          value={expiringCount}
          unit="건"
          href="/summary/expiry"
          icon={<CalendarClock className="h-4 w-4" />}
          accent="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          highlight={expiringCount > 0}
        />
      </section>

      {/* 차트 위젯 (시각화) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByPhaseChart rows={salesSummary} />
        <MaintenanceStatusDonut rows={statusDist} />
        <MonthlyContractsLine rows={monthlyContracts} />
      </section>

      {/* 상태별 · R&R별 요약 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 상태별 */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">민원 상태별 분포</h2>
            <Link href="/maintenance" className="text-xs text-primary hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COMMON_STATUSES.map((s) => (
              <Link
                key={s}
                href={`/maintenance?status=${encodeURIComponent(s)}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 hover:bg-accent transition-colors"
              >
                <StatusBadge status={s} size="sm" />
                <span className="text-sm font-semibold">{statusCounts[s]}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* R&R별 */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">R&R 담당자별 배분</h2>
            <Link href="/rnr/01" className="text-xs text-primary hover:underline">
              담당자별 상세 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RNR_STAFF_NOS.map((no) => (
              <Link
                key={no}
                href={`/rnr/${no}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-muted-foreground">{no}</span>
                  <span className="text-sm font-medium">
                    {RNR_STAFF_MAPPING[no as RnrStaffNo] || '(미지정)'}
                  </span>
                </div>
                <span className="text-sm font-semibold">{rnrCounts[no as RnrStaffNoEnum]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 최근 접수 민원 */}
      <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">최근 접수된 민원 (상태=접수)</h2>
          <Link href="/maintenance/inbox" className="text-xs text-primary hover:underline">
            접수현황 →
          </Link>
        </div>
        {recentInbox.length === 0 ? (
          <EmptyState
            title="접수 대기 민원이 없습니다."
            description="/complaint 에서 새 민원을 등록하면 이곳에 표시됩니다."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">차수/호수</th>
                  <th className="px-3 py-2">제목</th>
                  <th className="hidden px-3 py-2 sm:table-cell">숙박형태</th>
                  <th className="hidden px-3 py-2 sm:table-cell">R&R</th>
                  <th className="px-3 py-2">접수일시</th>
                </tr>
              </thead>
              <tbody>
                {recentInbox.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      {row.phase}차 {row.room_no}
                    </td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <StayTypeBadge stayType={row.stay_type} size="sm" />
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      {row.rnr_no ? (
                        <Link
                          href={`/rnr/${row.rnr_no}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {row.rnr_no} {RNR_STAFF_MAPPING[row.rnr_no as RnrStaffNo] ?? ''}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">미배분</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 만료 임박 계약 */}
      <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">만료 임박 계약 (90일 이내)</h2>
          <Link href="/summary/expiry" className="text-xs text-primary hover:underline">
            만료 세대수 →
          </Link>
        </div>
        {expiringContracts.length === 0 ? (
          <EmptyState title="90일 이내 만료 예정 계약이 없습니다." />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">차수/호수</th>
                  <th className="hidden px-3 py-2 sm:table-cell">숙박형태</th>
                  <th className="px-3 py-2">임차인</th>
                  <th className="px-3 py-2">운영종료</th>
                  <th className="px-3 py-2">임대종료</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      <Link
                        href={`/contracts/${row.id}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {row.phase}차 {row.room_no}
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <StayTypeBadge stayType={row.accommodation_type} size="sm" />
                    </td>
                    <td className="px-3 py-2">{row.tenant_name ?? '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(row.operation_end)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(row.lease_end)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 모바일 하단: 빠른 이동 */}
      <section className="grid grid-cols-2 gap-2 sm:hidden">
        <QuickLink href="/complaint" label="＋ 민원접수" />
        <QuickLink href="/maintenance/inbox" label="접수현황" />
        <QuickLink href="/contracts" label="계약관리" />
        <QuickLink href="/history" label="수정이력" />
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  unit,
  href,
  icon,
  accent,
  highlight,
}: {
  label: string
  value: number
  unit: string
  href: string
  icon: React.ReactNode
  accent: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4 ${
        highlight ? 'ring-1 ring-primary/30' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${accent}`}>
          {icon}
        </span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold sm:text-2xl">{value.toLocaleString('ko-KR')}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </Link>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center rounded-xl border border-border/60 bg-card px-3 py-3 text-[13px] font-medium text-foreground hover:bg-accent transition-colors"
    >
      {label}
    </Link>
  )
}
