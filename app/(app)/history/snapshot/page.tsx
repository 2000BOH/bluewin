// 히스토리 보기 (/history/snapshot)
// 날짜를 지정하면 그날 23:59:59 KST 기준의
//   - 접수현황 / 영선 / 개인별 R&R
//   - 계약관리
//   - 분양 요약 / 숙박 요약
// 을 재구성해 보여준다.
//
// change_history(트리거 002) 의 INSERT/UPDATE/DELETE 이벤트를 시간순 재생.

import { createServerSupabase } from '@/lib/supabase/server'
import {
  buildMaintenanceAt,
  buildContractsAt,
  buildRoomStatusAt,
  buildOperationPivotAt,
  buildStayPivotAt,
  buildRentPivotAt,
  buildSalesByPhaseAt,
} from '@/lib/queries/snapshot'
import PageHeader from '@/components/common/PageHeader'
import SnapshotDatePicker from './SnapshotDatePicker'
import SnapshotTabs from './SnapshotTabs'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] ?? '' : v ?? ''

const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default async function SnapshotPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const asOf = pickStr(searchParams.asOf) || yesterdayStr()
  const supabase = createServerSupabase()

  // 4개 테이블 재구성을 1회씩만 실행 (탭 사이 이동해도 재계산 X — URL asOf 같으면 캐시).
  const [maintenanceRows, contractRows, roomStatus, rentPivot] = await Promise.all([
    buildMaintenanceAt(supabase, asOf),
    buildContractsAt(supabase, asOf),
    buildRoomStatusAt(supabase, asOf),
    buildRentPivotAt(supabase, asOf),
  ])

  const opPivot = buildOperationPivotAt(roomStatus)
  const stayPivot = buildStayPivotAt(roomStatus)
  const salesByPhase = buildSalesByPhaseAt(roomStatus)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="히스토리"
        description="기준일을 지정하면 그날의 접수현황·영선·계약·요약·R&R 을 재구성해 보여줍니다."
      />

      <SnapshotDatePicker currentAsOf={asOf} />

      <SnapshotTabs
        maintenanceRows={maintenanceRows}
        contractRows={contractRows}
        opPivot={opPivot}
        stayPivot={stayPivot}
        rentPivot={rentPivot}
        salesByPhase={salesByPhase}
      />
    </div>
  )
}
