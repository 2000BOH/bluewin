'use client'

// 히스토리 보기 — 계약관리 (읽기 전용).
// 기본 11개 컬럼 + "모든 컬럼 보기" 토글로 전체 펼침.
// 라이브 페이지의 InlineContractEditor 는 사용하지 않는다(스냅샷이므로).

import { useState, useMemo } from 'react'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import type { ContractListItem } from '@/lib/queries/contracts'

type Row = ContractListItem & { _synthetic?: boolean }

const SyntheticBadge = () => (
  <span title="트리거 이전 데이터(폴백)" className="ml-1 text-amber-600">⚠️</span>
)

// 기본 11컬럼 (CLAUDE.md 규칙).
const renderBase = (r: Row) => (
  <>
    <td className="px-3 py-2">
      {r.phase}차{r._synthetic && <SyntheticBadge />}
    </td>
    <td className="px-3 py-2 font-medium">{r.room_no}</td>
    <td className="px-3 py-2">{r.room_type ?? '-'}</td>
    <td className="px-3 py-2">{r.view_type ?? '-'}</td>
    <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
    <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.operation_end)}</td>
    <td className="px-3 py-2 max-w-[180px] truncate" title={r.note ?? ''}>{r.note ?? '-'}</td>
    <td className="px-3 py-2"><StayTypeBadge stayType={r.accommodation_type} size="sm" /></td>
    <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
    <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.lease_end)}</td>
    <td className="px-3 py-2">{r.tenant_phone ?? '-'}</td>
  </>
)

const EXTRA_COLS: Array<{ key: keyof ContractListItem | string; label: string; render: (r: Row) => React.ReactNode }> = [
  { key: 'sale_area', label: '분양면적', render: (r) => r.sale_area ?? '-' },
  { key: 'total_supply_amount', label: '총공급금액', render: (r) => formatCurrency(r.total_supply_amount) },
  { key: 'buyer_no', label: '계약자번호', render: (r) => r.buyer_no ?? '-' },
  { key: 'buyer_type', label: '개인/법인', render: (r) => r.buyer_type ?? '-' },
  { key: 'contract_status', label: '계약상태', render: (r) => r.contract_status ?? '-' },
  { key: 'contract_date', label: '계약(잔금)일', render: (r) => formatDate(r.contract_date) },
  { key: 'operation_start', label: '운영시작일', render: (r) => formatDate(r.operation_start) },
  { key: 'operation_type', label: '운영방식', render: (r) => r.operation_type ?? '-' },
  { key: 'settlement_amount', label: '확정지급액', render: (r) => formatCurrency(r.settlement_amount) },
  { key: 'commission_amount', label: '수수료금액', render: (r) => formatCurrency(r.commission_amount) },
  { key: 'contract_form', label: '계약형태', render: (r) => r.contract_form ?? '-' },
  { key: 'reverse_issuance', label: '역발행여부', render: (r) => (r.reverse_issuance ? '예' : '아니오') },
  { key: 'entrustment_date', label: '위탁일', render: (r) => formatDate(r.entrustment_date) },
  { key: 'rent_free_months', label: '렌트프리(개월)', render: (r) => r.rent_free_months ?? '-' },
  { key: 'deposit_amount', label: '보증금', render: (r) => formatCurrency(r.deposit_amount) },
  { key: 'monthly_rent', label: '임대료', render: (r) => formatCurrency(r.monthly_rent) },
  { key: 'lease_start', label: '임대시작', render: (r) => formatDate(r.lease_start) },
]

type Props = { rows: Row[] }

export default function ContractsSnapshotTable({ rows }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [phase, setPhase] = useState('')
  const [roomNo, setRoomNo] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (phase && String(r.phase) !== phase) return false
      if (roomNo && !(r.room_no ?? '').includes(roomNo)) return false
      return true
    })
  }, [rows, phase, roomNo])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">차수</span>
          <input
            type="number"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder="전체"
            className="w-24 rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">호수</span>
          <input
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            placeholder="전체"
            className="w-32 rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="ml-auto flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          <span>모든 컬럼 보기 (펼치기)</span>
        </label>
      </div>

      <div className="text-sm text-muted-foreground">
        전체 <span className="font-semibold text-foreground">{filtered.length}</span>건
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="해당 시점에 계약 데이터가 없습니다." />
      ) : (
        <div className="data-table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">차수</th>
                <th className="px-3 py-2 whitespace-nowrap">호수</th>
                <th className="px-3 py-2 whitespace-nowrap">타입</th>
                <th className="px-3 py-2 whitespace-nowrap">조망</th>
                <th className="px-3 py-2 whitespace-nowrap">계약자명</th>
                <th className="px-3 py-2 whitespace-nowrap">운영종료일</th>
                <th className="px-3 py-2 whitespace-nowrap">비고</th>
                <th className="px-3 py-2 whitespace-nowrap">숙박형태</th>
                <th className="px-3 py-2 whitespace-nowrap">임차인</th>
                <th className="px-3 py-2 whitespace-nowrap">임대종료</th>
                <th className="px-3 py-2 whitespace-nowrap">임차인 연락처</th>
                {showAll &&
                  EXTRA_COLS.map((c) => (
                    <th key={String(c.key)} className="px-3 py-2 whitespace-nowrap">{c.label}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  {renderBase(r)}
                  {showAll &&
                    EXTRA_COLS.map((c) => (
                      <td key={String(c.key)} className="px-3 py-2 whitespace-nowrap">
                        {c.render(r)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
