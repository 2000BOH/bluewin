// 입주지원 (/maintenance/move-in)
// status=입주지원 인 maintenance_requests 레코드를 관리한다.
// 신규 등록 시 rnr_no='01'(유태형 과장) 자동 배정.
// listMoveIn 사용 — DB enum에 '입주지원'이 없어도 JS 필터로 동작.

import { createServerSupabase } from '@/lib/supabase/server'
import { listMoveIn } from '@/lib/queries/maintenance'
import PageHeader from '@/components/common/PageHeader'
import MoveInTable from './MoveInTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? '') : (v ?? '')

export default async function MoveInPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const done        = pickStr(searchParams.done)
  const statusParam = pickStr(searchParams.status)

  const statusValue =
    statusParam ? statusParam :
    done === 'done' ? '완료' :
    '입주지원'

  const supabase = createServerSupabase()
  const rows = await listMoveIn(supabase, {
    statusValue,
    requester: pickStr(searchParams.requester) || null,
    from:      pickStr(searchParams.from) || null,
    to:        pickStr(searchParams.to)   || null,
  })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="입주지원"
        description="입주지원 요청을 관리합니다. 담당자: 유태형 과장 (01). 신규 등록 시 자동 배정됩니다."
      />
      <MoveInTable rows={rows} />
    </div>
  )
}
