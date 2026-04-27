// R&R 담당자별 배분현황 (/rnr/[staffNo])
// 담당자(01~06)별로 배분된 민원/영선 요청을 상태 무관하게 전체 조회.
// 담당자 이름: types/status.ts RNR_STAFF_MAPPING (단일 원천) 사용.
// rnr_mapping DB: 담당자별 숙박형태(stay_types) 규칙 조회 전용.

import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance } from '@/lib/queries/maintenance'
import { listRnrMapping } from '@/lib/queries/rnr'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils/format'
import { RNR_STAFF_NOS, RNR_STAFF_MAPPING, type RnrStaffNo } from '@/types/status'
import type { RnrStaffNoEnum } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const isStaffNo = (v: string): v is RnrStaffNoEnum =>
  (RNR_STAFF_NOS as readonly string[]).includes(v)

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

export default async function RnrDetailPage({
  params,
  searchParams,
}: {
  params: { staffNo: string }
  searchParams: SearchParams
}) {
  if (!isStaffNo(params.staffNo)) notFound()

  const supabase = createServerSupabase()
  const statusFilter = pickStr(searchParams.status)

  const [rows, mapping] = await Promise.all([
    listMaintenance(supabase, {
      rnrNo: params.staffNo,
      status: statusFilter && statusFilter !== '전체' ? (statusFilter as '접수' | '영선' | '외부업체' | '퇴실' | '청소' | '완료') : null,
    }),
    listRnrMapping(supabase),
  ])
  const currentName = RNR_STAFF_MAPPING[params.staffNo as RnrStaffNo] || '(이름 미설정)'
  const assigned = mapping.find((m) => m.rnr_no === params.staffNo)
  const stayTypes = assigned?.stay_types ?? []

  const counts = {
    total: rows.length,
    접수: rows.filter((r) => r.status === '접수').length,
    영선: rows.filter((r) => r.status === '영선').length,
    완료: rows.filter((r) => r.status === '완료').length,
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={`R&R ${params.staffNo} · ${currentName}`}
        description={
          stayTypes.length > 0
            ? `담당 숙박형태: ${stayTypes.join(', ')}`
            : '담당 숙박형태가 지정되지 않았습니다. (관리자 매핑 필요)'
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="전체" value={counts.total} />
        <StatCard label="접수" value={counts.접수} />
        <StatCard label="영선" value={counts.영선} />
        <StatCard label="완료" value={counts.완료} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="배분된 요청이 없습니다."
          description="해당 담당자에게 배분된 민원/영선 요청이 없습니다."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">차수</th>
                <th className="px-3 py-2">호수</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">숙박형태</th>
                <th className="px-3 py-2">요청자</th>
                <th className="px-3 py-2">접수일시</th>
                <th className="px-3 py-2">출처</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{row.phase}차</td>
                  <td className="px-3 py-2">{row.room_no}</td>
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="px-3 py-2">
                    <StayTypeBadge stayType={row.stay_type} size="sm" />
                  </td>
                  <td className="px-3 py-2">{row.requester ?? '-'}</td>
                  <td className="px-3 py-2">{formatDateTime(row.created_at)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.source}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
