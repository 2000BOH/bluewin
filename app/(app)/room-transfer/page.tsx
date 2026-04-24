// 객실이동 (/room-transfer) - Phase 5
// "영선" 상태 선택 시 자동으로 영선 페이지에 등록 + 이동 안내.

import { createServerSupabase } from '@/lib/supabase/server'
import { listTransfers, type TransferFilter } from '@/lib/queries/room-transfer'
import PageHeader from '@/components/common/PageHeader'
import TransferTable from './TransferTable'
import type { CommonStatus } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

const pickStr = (v: string | string[] | undefined): string | null => {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

const buildFilter = (params: SearchParams): TransferFilter => ({
  fromPhase: pickStr(params.from_phase) ? Number(pickStr(params.from_phase)) : null,
  toPhase: pickStr(params.to_phase) ? Number(pickStr(params.to_phase)) : null,
  roomNo: pickStr(params.room_no),
  status: (pickStr(params.status) as CommonStatus) || null,
  tenantName: pickStr(params.tenant_name),
  from: pickStr(params.from),
  to: pickStr(params.to),
})

export default async function RoomTransferPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listTransfers(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실이동 관리"
        description="객실 이동 이력을 관리합니다. 상태를 '영선'으로 변경하면 영선 페이지에 자동 등록됩니다."
      />
      <TransferTable rows={rows} />
    </div>
  )
}
