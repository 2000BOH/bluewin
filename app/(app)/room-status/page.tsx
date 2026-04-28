// 객실현황 데이터 (/room-status) - Phase 15
// 모든 객실의 현 상태(계약여부/임차정보/임대만료)를 한눈에 표시.

import { createServerSupabase } from '@/lib/supabase/server'
import { getRoomStatus } from '@/lib/queries/summary'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'

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
      <div className="data-table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-center">계약여부</th>
              <th className="px-3 py-2 text-left">계약자</th>
              <th className="px-3 py-2 text-left">운영방식</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">임차연락처</th>
              <th className="px-3 py-2 text-left">임대종료</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2">{r.type ?? '-'}</td>
                <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      r.is_sold
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {r.is_sold ? '계약' : '미계약'}
                  </span>
                </td>
                <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{r.operation_type ?? '-'}</td>
                <td className="px-3 py-2">{r.accommodation_type ?? '-'}</td>
                <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.tenant_phone ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-xs">{formatDate(r.lease_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="등록된 객실이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
