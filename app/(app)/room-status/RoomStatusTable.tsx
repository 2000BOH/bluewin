'use client'

// 객실정보 테이블 — 숙박형태 인라인 변경 지원.

import InlineStayTypeSelect from '@/components/common/InlineStayTypeSelect'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'
import type { RoomStatusRow } from '@/lib/queries/summary'
import { updateContractStayTypeAction } from '@/app/(app)/contracts/actions'
import type { StayType } from '@/types/status'

type Props = { rows: RoomStatusRow[] }

export default function RoomStatusTable({ rows }: Props) {
  return (
    <div className="data-table-wrap">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            {['차수','호수','타입','조망','계약여부','계약자','운영방식','숙박형태','임차인','임차연락처','임대종료'].map((h) => (
              <th key={h} className={`px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-muted-foreground${h === '계약여부' ? ' text-center' : ''}`}>
                {h}
              </th>
            ))}
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
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  r.is_sold
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {r.is_sold ? '계약' : '미계약'}
                </span>
              </td>
              <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
              <td className="px-3 py-2">{r.operation_type ?? '-'}</td>
              <td className="px-3 py-2">
                {r.contract_id ? (
                  <InlineStayTypeSelect
                    stayType={r.accommodation_type}
                    size="sm"
                    onChange={(next) => updateContractStayTypeAction(r.contract_id!, next as StayType | null)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.tenant_phone ?? '-'}</td>
              <td className="px-3 py-2 font-mono text-xs">{formatDate(r.lease_end)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-6"><EmptyState description="등록된 객실이 없습니다." /></div>
      )}
    </div>
  )
}
