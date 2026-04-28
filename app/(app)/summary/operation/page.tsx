// 숙박 요약 (/summary/operation)
// Summary 탭: 차수 × 숙박형태 분포 + 하단 대시보드
// Detail  탭: 차수 × 숙박형태 × 운영방식 cross-tab

import { createServerSupabase } from '@/lib/supabase/server'
import { getStayByPhasePivot, getOperationDetail } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import OperationTabs from './OperationTabs'

export const dynamic = 'force-dynamic'

export default async function SummaryOperationPage() {
  const supabase = createServerSupabase()
  const [summary, detail] = await Promise.all([
    getStayByPhasePivot(supabase),
    getOperationDetail(supabase),
  ])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="숙박 요약"
        description={`전체 ${summary.grandTotal.toLocaleString()}실 — 차수별 숙박형태/운영방식 집계`}
      />
      <OperationTabs summary={summary} detail={detail} />
    </div>
  )
}
