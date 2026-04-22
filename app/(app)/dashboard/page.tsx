// 대시보드 임시 화면.
// Phase 3 시점에는 공통 상태 배지(StatusBadge) 미리보기를 노출해 디자인을 즉시 확인.
// 실제 위젯/통계는 후속 Phase 에서 추가.

import StatusBadge from '@/components/common/StatusBadge'
import { COMMON_STATUSES } from '@/types/status'
import { STATUS_STYLE } from '@/lib/utils/status'

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold">Bluewin 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          분양 + 객실·영선 통합 관리 시스템 — Phase 3 진행 중
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">공통 상태 배지 미리보기</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          영선 / 객실이동 / 객실체크 / 객실정비 4개 페이지에서 공통으로 사용하는 6가지 상태입니다.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMON_STATUSES.map((status) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-md border bg-background px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{status}</div>
                <div className="text-xs text-muted-foreground">
                  {STATUS_STYLE[status].description}
                </div>
              </div>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
