// 접수현황 (/maintenance/inbox) - PDF 페이지 구성 신설
// 상태="접수" 인 maintenance_requests 를 R&R 담당자/숙박형태와 함께 조회.
// 세부 처리는 상태 변경 → 영선/객실체크/객실정비 페이지로 자동 연동된다.

import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance } from '@/lib/queries/maintenance'
import { listRnrMapping, buildRnrNameMap } from '@/lib/queries/rnr'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils/format'
import type { RnrStaffNoEnum } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

export default async function MaintenanceInboxPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rnrNo = pickStr(searchParams.rnr_no) as RnrStaffNoEnum | null
  const stayType = pickStr(searchParams.stay_type)
  const phase = pickStr(searchParams.phase)

  const [rows, rnrMap] = await Promise.all([
    listMaintenance(supabase, {
      status: '접수',
      rnrNo: rnrNo ?? null,
      stayType: stayType ?? null,
      phase: phase ? Number(phase) : null,
    }),
    listRnrMapping(supabase),
  ])
  const nameMap = buildRnrNameMap(rnrMap)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="접수현황"
        description="상태='접수'인 요청 목록. 숙박형태 기반으로 R&R 담당자가 자동 배분됩니다. 상태를 변경하면 영선/객실체크/객실정비 페이지로 자동 연동됩니다."
      />

      {/* 간단 필터 (R&R 번호 6개 + 전체) */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FilterLink label="전체" rnrNo={null} currentRnr={rnrNo ?? null} />
        {(['01', '02', '03', '04', '05', '06'] as const).map((no) => (
          <FilterLink
            key={no}
            label={`${no} ${nameMap[no] ?? ''}`.trim()}
            rnrNo={no}
            currentRnr={rnrNo ?? null}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="접수된 민원이 없습니다." description="민원접수 페이지에서 새 요청을 등록하면 이 페이지에 표시됩니다." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">차수</th>
                <th className="px-3 py-2">호수</th>
                <th className="px-3 py-2">민원 제목</th>
                <th className="px-3 py-2">숙박형태</th>
                <th className="px-3 py-2">R&R</th>
                <th className="px-3 py-2">요청자</th>
                <th className="px-3 py-2">접수일시</th>
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
                  <td className="px-3 py-2">
                    {row.rnr_no ? (
                      <Link
                        href={`/rnr/${row.rnr_no}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {row.rnr_no} {nameMap[row.rnr_no as RnrStaffNoEnum] ?? ''}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">미배분</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.requester ?? '-'}</td>
                  <td className="px-3 py-2">{formatDateTime(row.created_at)}</td>
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

function FilterLink({
  label,
  rnrNo,
  currentRnr,
}: {
  label: string
  rnrNo: RnrStaffNoEnum | null
  currentRnr: RnrStaffNoEnum | null
}) {
  const active = currentRnr === rnrNo
  const href = rnrNo ? `/maintenance/inbox?rnr_no=${rnrNo}` : '/maintenance/inbox'
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-primary bg-primary px-3 py-1 text-primary-foreground'
          : 'rounded-full border border-input bg-background px-3 py-1 hover:bg-muted'
      }
    >
      {label}
    </Link>
  )
}
