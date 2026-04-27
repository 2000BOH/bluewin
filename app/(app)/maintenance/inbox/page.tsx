// 접수현황 (/maintenance/inbox)
// 완료구분·날짜범위·접수자·처리상태 필터 지원.

import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance } from '@/lib/queries/maintenance'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils/format'
import {
  SOURCE_LABELS,
  RNR_STAFF_MAPPING,
  type MaintenanceSource,
  type RnrStaffNo,
} from '@/types/status'
import type { CommonStatus } from '@/types/supabase'
import InboxFilterBar from './InboxFilterBar'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? '') : (v ?? '')

export default async function MaintenanceInboxPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()

  const dateFrom    = pickStr(searchParams.dateFrom)
  const dateTo      = pickStr(searchParams.dateTo)
  const done        = pickStr(searchParams.done)
  const requester   = pickStr(searchParams.requester)
  const statusParam = pickStr(searchParams.status) as CommonStatus | ''

  const statusFilter: CommonStatus | null    = done === 'done'   ? '완료' : null
  const statusNotFilter: CommonStatus | null = done === 'undone' ? '완료' : null
  const resolvedStatus: CommonStatus | null  = statusParam ? (statusParam as CommonStatus) : statusFilter

  const rows = await listMaintenance(supabase, {
    status:    resolvedStatus,
    statusNot: statusParam ? null : statusNotFilter,
    requester: requester || null,
    from:      dateFrom || null,
    to:        dateTo   || null,
  })

  const hasFilter = !!(dateFrom || dateTo || done || requester || statusParam)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="접수현황"
        description="전체 민원 및 영선 요청 목록입니다. 완료구분·날짜·접수자·처리상태로 필터링할 수 있습니다."
      />

      <InboxFilterBar
        defaults={{ dateFrom, dateTo, done, requester, status: statusParam }}
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {hasFilter ? '검색 결과' : '전체'}{' '}
          <span className="font-semibold text-foreground">{rows.length}건</span>
          {done === 'done' && ' · 완료'}
          {done === 'undone' && ' · 미완료'}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="조건에 맞는 민원이 없습니다."
          description="필터를 변경하거나 전체 버튼을 눌러 전체 목록을 확인하세요."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">No</th>
                <th className="px-3 py-2 whitespace-nowrap">차수</th>
                <th className="px-3 py-2 whitespace-nowrap">호수</th>
                <th className="px-3 py-2 whitespace-nowrap">출처</th>
                <th className="px-3 py-2 whitespace-nowrap">민원 제목</th>
                <th className="px-3 py-2 whitespace-nowrap">숙박형태</th>
                <th className="px-3 py-2 whitespace-nowrap">R&R</th>
                <th className="px-3 py-2 whitespace-nowrap">접수자</th>
                <th className="px-3 py-2 whitespace-nowrap">접수일시</th>
                <th className="px-3 py-2 whitespace-nowrap">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2">{row.phase}차</td>
                  <td className="px-3 py-2 font-medium">{row.room_no}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {SOURCE_LABELS[row.source as MaintenanceSource] ?? row.source ?? '-'}
                  </td>
                  <td className="px-3 py-2 max-w-[180px] truncate" title={row.title ?? ''}>
                    {row.title ?? '-'}
                  </td>
                  <td className="px-3 py-2">
                    <StayTypeBadge stayType={row.stay_type} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    {row.rnr_no ? (
                      <Link
                        href={`/rnr/${row.rnr_no}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {RNR_STAFF_MAPPING[row.rnr_no as RnrStaffNo] ?? row.rnr_no}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">미배분</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.requester ?? '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {formatDateTime(row.created_at)}
                  </td>
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
