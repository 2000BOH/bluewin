// 객실체크 (/room-check) - Phase 6

import { createServerSupabase } from '@/lib/supabase/server'
import { listChecks, type CheckFilter } from '@/lib/queries/room-check'
import PageHeader from '@/components/common/PageHeader'
import CheckTable from './CheckTable'
import type { CommonStatus, OverallCheckStatus } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): CheckFilter => {
  const phase = pickStr(params.phase)
  return {
    phase: phase ? Number(phase) : null,
    roomNo: pickStr(params.room_no),
    status: (pickStr(params.status) as CommonStatus) || null,
    overall: (pickStr(params.overall) as OverallCheckStatus) || null,
    from: pickStr(params.from),
    to: pickStr(params.to),
  }
}

export default async function RoomCheckPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listChecks(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실체크 관리"
        description="객실 점검 결과를 기록합니다. 처리 상태를 '영선반'으로 변경하면 영선 페이지에 자동 등록됩니다."
      />
      <CheckTable rows={rows} />
    </div>
  )
}
