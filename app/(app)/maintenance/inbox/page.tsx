// 접수현황 (/maintenance/inbox)
// 완료구분·날짜범위·접수자·처리상태 필터 지원.

import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance } from '@/lib/queries/maintenance'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import type { CommonStatus } from '@/types/supabase'
import InboxFilterBar from './InboxFilterBar'
import InboxTable from './InboxTable'

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
        <InboxTable rows={rows} />
      )}
    </div>
  )
}
