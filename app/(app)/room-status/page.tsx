// 객실현황 데이터 (/room-status)
// 모든 객실의 현 상태(계약여부/임차정보/임대만료)를 한눈에 표시. 숙박형태 인라인 변경 가능.

import { createServerSupabase } from '@/lib/supabase/server'
import { getRoomStatus } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import RoomStatusTable from './RoomStatusTable'

export const dynamic = 'force-dynamic'

export default async function RoomStatusPage() {
  const supabase = createServerSupabase()
  const rows = await getRoomStatus(supabase)
  const totals = {
    total: rows.length,
    sold: rows.filter((r) => r.is_sold).length,
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실정보"
        description={`전체 ${totals.total}실 / 계약 ${totals.sold}실 / 미계약 ${totals.total - totals.sold}실`}
      />
      <RoomStatusTable rows={rows} />
    </div>
  )
}
