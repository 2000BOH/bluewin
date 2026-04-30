'use client'

// 접수현황 목록 테이블 (클라이언트). 우선/완료 토글 + 정렬을 위해 분리.

import { useMemo } from 'react'
import Link from 'next/link'
import InlineStatusSelect from '@/components/common/InlineStatusSelect'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import RowActionCell from '@/components/common/RowActionCell'
import { updateMaintenanceStatusAction } from '../actions'
import { formatDateTime } from '@/lib/utils/format'
import {
  SOURCE_LABELS,
  RNR_STAFF_MAPPING,
  type MaintenanceSource,
  type RnrStaffNo,
} from '@/types/status'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import {
  rowFlagClass,
  sortByFlag,
  useRowFlags,
} from '@/lib/hooks/useRowFlags'

type Props = { rows: MaintenanceRow[] }

export default function InboxTable({ rows }: Props) {
  const { flagsOf, togglePriority, toggleDone, prioritySnapshot } =
    useRowFlags('maintenance-inbox')
  const sorted = useMemo(
    () => sortByFlag(rows, prioritySnapshot),
    [rows, prioritySnapshot],
  )

  return (
    <div className="data-table-wrap">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left">
          <tr>
            <th className="px-3 py-2 whitespace-nowrap">No</th>
            <th className="px-3 py-2 whitespace-nowrap">
              <span className="inline-flex items-center gap-2">
                <span className="w-6 text-center">우선</span>
                <span className="text-[11px] text-muted-foreground">완료</span>
              </span>
            </th>
            <th className="px-3 py-2 whitespace-nowrap">차수</th>
            <th className="px-3 py-2 whitespace-nowrap">호수</th>
            <th className="px-3 py-2 whitespace-nowrap">출처</th>
            <th className="px-3 py-2 whitespace-nowrap">민원 제목</th>
            <th className="px-3 py-2 whitespace-nowrap">숙박형태</th>
            <th className="px-3 py-2 whitespace-nowrap">R&amp;R</th>
            <th className="px-3 py-2 whitespace-nowrap">접수자</th>
            <th className="px-3 py-2 whitespace-nowrap">접수일시</th>
            <th className="px-3 py-2 whitespace-nowrap !text-center">상태</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const flags = flagsOf(row.id)
            return (
              <tr key={row.id} className={`border-t ${rowFlagClass(flags)}`}>
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">
                  <RowActionCell
                    priority={flags.priority}
                    done={flags.done}
                    onPriority={() => togglePriority(row.id)}
                    onDone={() => toggleDone(row.id)}
                  />
                </td>
                <td className="px-3 py-2">{row.phase}차</td>
                <td className="px-3 py-2 font-medium">{row.room_no}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {SOURCE_LABELS[row.source as MaintenanceSource] ?? row.source ?? '-'}
                </td>
                <td className="px-3 py-2 max-w-[180px] truncate" title={row.title ?? ''}>
                  {row.title ?? '-'}
                </td>
                <td className="px-3 py-2">
                  <StayTypeBadge stayType={row.stay_type} size="sm" />
                </td>
                <td className="px-3 py-2">
                  {row.rnr_no ? (
                    <Link
                      href={`/rnr/${row.rnr_no}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {RNR_STAFF_MAPPING[row.rnr_no as RnrStaffNo] ?? row.rnr_no}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">미배분</span>
                  )}
                </td>
                <td className="px-3 py-2">{row.requester ?? '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {formatDateTime(row.created_at)}
                </td>
                <td className="px-3 py-2 text-center">
                  <InlineStatusSelect
                    status={row.status}
                    size="sm"
                    onChange={(next) => updateMaintenanceStatusAction(row.id, next)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
