// 객실정비 (/room-maintenance) - Phase 7

import { createServerSupabase } from '@/lib/supabase/server'
import { listTasks, type TaskFilter } from '@/lib/queries/room-maintenance-task'
import PageHeader from '@/components/common/PageHeader'
import TaskTable from './TaskTable'
import type { CommonStatus } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): TaskFilter => {
  const done        = pickStr(params.done)
  const statusParam = pickStr(params.status) as CommonStatus | null
  const status: CommonStatus | null =
    statusParam ?? (done === 'done' ? '완료' : null)
  const statusNot: CommonStatus | null =
    !statusParam && done === 'undone' ? '완료' : null

  return {
    status,
    statusNot,
    requester: pickStr(params.requester),
    from:      pickStr(params.from),
    to:        pickStr(params.to),
  }
}

export default async function RoomMaintenancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listTasks(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실정비 관리"
        description="청소/수리/비품교체/도배장판/설비/기타 정비 작업을 관리합니다. '영선' 선택 시 자동 등록."
      />
      <TaskTable rows={rows} />
    </div>
  )
}
