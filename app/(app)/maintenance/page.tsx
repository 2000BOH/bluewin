// 영선 (/maintenance) - Phase 4
// 다른 페이지에서 "영선" 상태 선택 시 자동으로 등록되는 요청을 모아서 관리.

import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance, type MaintenanceFilter } from '@/lib/queries/maintenance'
import PageHeader from '@/components/common/PageHeader'
import MaintenanceTable from './MaintenanceTable'
import type { CommonStatus } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

const pickStr = (v: string | string[] | undefined): string | null => {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

const buildFilter = (params: SearchParams): MaintenanceFilter => {
  const done       = pickStr(params.done)         // 'done' | 'undone' | null
  const statusParam = pickStr(params.status) as CommonStatus | null

  // 처리상태 명시 선택이 완료구분보다 우선
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

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const filter = buildFilter(searchParams)
  const rows = await listMaintenance(supabase, filter)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="영선"
        description="객실이동/체크/정비 페이지에서 '영선' 상태로 전환되면 이 페이지에 자동 등록됩니다."
      />
      <MaintenanceTable rows={rows} />
    </div>
  )
}
