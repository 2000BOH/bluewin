// 객실체크 (/room-check)
// maintenance_requests 에서 처리상태='퇴실' 인 레코드를 표시한다.

import { createServerSupabase } from '@/lib/supabase/server'
import { listMaintenance } from '@/lib/queries/maintenance'
import PageHeader from '@/components/common/PageHeader'
import CheckTable from './CheckTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? '') : (v ?? '')

export default async function RoomCheckPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const done        = pickStr(searchParams.done)
  const statusParam = pickStr(searchParams.status)

  const statusValue =
    statusParam ? statusParam :
    done === 'done' ? '완료' :
    '퇴실'

  const supabase = createServerSupabase()
  const rows = await listMaintenance(supabase, {
    status:    statusValue as import('@/types/supabase').CommonStatus,
    statusNot: null,
    requester: pickStr(searchParams.requester) || null,
    from:      pickStr(searchParams.from) || null,
    to:        pickStr(searchParams.to)   || null,
  })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실체크"
        description="처리상태가 퇴실인 요청을 관리합니다. 처리상태 변경 시 해당 페이지로 자동 이동됩니다."
      />
      <CheckTable rows={rows} />
    </div>
  )
}
