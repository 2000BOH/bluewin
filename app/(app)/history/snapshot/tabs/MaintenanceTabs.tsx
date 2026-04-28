'use client'

// 히스토리 보기 — 접수현황 / 영선 / 개인별 R&R 통합 탭.
// 모두 maintenance_requests 스냅샷 한 묶음에서 필터링해 보여준다.

import { useState, useMemo } from 'react'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/lib/utils/format'
import {
  RNR_STAFF_NOS,
  RNR_STAFF_MAPPING,
  type RnrStaffNo,
} from '@/types/status'
import type { MaintenanceRow } from '@/lib/queries/maintenance'

type SubTab = 'inbox' | 'all' | 'rnr'
type Row = MaintenanceRow & { _synthetic?: boolean }

const SyntheticBadge = () => (
  <span title="트리거 이전 데이터(폴백)" className="ml-1 text-amber-600">⚠️</span>
)

const Table = ({ rows }: { rows: Row[] }) => {
  if (rows.length === 0) {
    return <EmptyState title="해당 시점에 데이터가 없습니다." />
  }
  return (
    <div className="data-table-wrap">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left">
          <tr>
            <th className="px-3 py-2 whitespace-nowrap">No</th>
            <th className="px-3 py-2 whitespace-nowrap">차수</th>
            <th className="px-3 py-2 whitespace-nowrap">호수</th>
            <th className="px-3 py-2 whitespace-nowrap">민원 제목</th>
            <th className="px-3 py-2 whitespace-nowrap">숙박형태</th>
            <th className="px-3 py-2 whitespace-nowrap">R&R</th>
            <th className="px-3 py-2 whitespace-nowrap">접수자</th>
            <th className="px-3 py-2 whitespace-nowrap">접수일시</th>
            <th className="px-3 py-2 whitespace-nowrap">상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
              <td className="px-3 py-2">
                {row.phase}차{row._synthetic && <SyntheticBadge />}
              </td>
              <td className="px-3 py-2 font-medium">{row.room_no}</td>
              <td className="px-3 py-2 max-w-[200px] truncate" title={row.title ?? ''}>
                {row.title ?? '-'}
              </td>
              <td className="px-3 py-2">
                <StayTypeBadge stayType={row.stay_type} size="sm" />
              </td>
              <td className="px-3 py-2">
                {row.rnr_no ? (
                  <span className="font-medium">
                    {RNR_STAFF_MAPPING[row.rnr_no as RnrStaffNo] || row.rnr_no}
                  </span>
                ) : (
                  <span className="text-muted-foreground">미배분</span>
                )}
              </td>
              <td className="px-3 py-2">{row.requester ?? '-'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-xs">
                {formatDateTime(row.created_at)}
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={row.status} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  rows: Row[]
}

export default function MaintenanceTabs({ rows }: Props) {
  const [tab, setTab] = useState<SubTab>('inbox')
  const [rnrPick, setRnrPick] = useState<RnrStaffNo>('01')

  const inboxRows = useMemo(() => rows.filter((r) => r.status === '접수'), [rows])
  const rnrRows = useMemo(() => rows.filter((r) => r.rnr_no === rnrPick), [rows, rnrPick])

  const visibleRnrNos = RNR_STAFF_NOS.filter(
    (no) => RNR_STAFF_MAPPING[no as RnrStaffNo].trim() !== '',
  )

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="-mb-px flex gap-1">
          {(
            [
              { k: 'inbox', label: '접수현황', sub: '상태=접수' },
              { k: 'all', label: '영선', sub: '전체' },
              { k: 'rnr', label: '개인별 R&R', sub: '담당자별' },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`flex flex-col items-start border-b-2 px-5 py-2.5 text-sm font-medium transition ${
                tab === t.k
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[11px] text-muted-foreground/70 font-normal">{t.sub}</span>
            </button>
          ))}
        </nav>
      </div>

      {tab === 'inbox' && (
        <section className="space-y-2">
          <div className="text-sm text-muted-foreground">
            접수 대기 <span className="font-semibold text-foreground">{inboxRows.length}</span>건
          </div>
          <Table rows={inboxRows} />
        </section>
      )}

      {tab === 'all' && (
        <section className="space-y-2">
          <div className="text-sm text-muted-foreground">
            전체 <span className="font-semibold text-foreground">{rows.length}</span>건
          </div>
          <Table rows={rows} />
        </section>
      )}

      {tab === 'rnr' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">담당자:</span>
            {visibleRnrNos.map((no) => (
              <button
                key={no}
                type="button"
                onClick={() => setRnrPick(no as RnrStaffNo)}
                className={`rounded-md border px-3 py-1 text-xs ${
                  rnrPick === no
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {no} {RNR_STAFF_MAPPING[no as RnrStaffNo]}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {RNR_STAFF_MAPPING[rnrPick]} 배분{' '}
            <span className="font-semibold text-foreground">{rnrRows.length}</span>건
          </div>
          <Table rows={rnrRows} />
        </section>
      )}
    </div>
  )
}
