'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ExpiryRow } from '@/lib/queries/summary'
import InlineContractEditor from '@/app/(app)/contracts/InlineContractEditor'

type BuyerOption = { id: string; name1: string; buyer_no: string }
type Props = { rows: ExpiryRow[]; buyers: BuyerOption[]; emptyMessage: string }

const BASE_COL_COUNT = 6 // 차수, 호수, 계약자, 임차인, 종료일, D-Day

export default function ExpiryTable({ rows, buyers, emptyMessage }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const totalCols = 1 + BASE_COL_COUNT // chevron + 6

  return (
    <div className="space-y-4">
      {/* 모바일: 카드형 목록 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description={emptyMessage} />
          </div>
        ) : (
          rows.map((r) => {
            const isOpen = !!expanded[r.id]
            const isNegative = r.days_left < 0
            const isSoon = r.days_left >= 0 && r.days_left <= 30
            
            return (
              <div key={r.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/contracts/${r.id}`} className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-mono font-semibold">
                        {r.phase}차 {r.room_no}
                      </span>
                      <span className={`text-xs font-bold ${isNegative ? 'text-destructive' : isSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {isNegative ? `D+${Math.abs(r.days_left)}` : `D-${r.days_left}`}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.buyer_name ?? '-'} · {r.tenant_name ?? '임차인 미지정'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      운영종료: {formatDate(r.operation_end)}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(r.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={isOpen ? '접기' : '펼치기'}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 border-t pt-3">
                    <InlineContractEditor
                      row={r}
                      buyers={buyers}
                      onClose={() => toggleExpand(r.id)}
                      onSaved={() => { toggleExpand(r.id); router.refresh() }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 데스크톱: 테이블 + 행별 펼치기 */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-2 w-8"></th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">계약자</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">운영종료일</th>
              <th className="px-3 py-2 text-right">D-Day</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = !!expanded[r.id]
              const isNegative = r.days_left < 0
              const isSoon = r.days_left >= 0 && r.days_left <= 30
              
              return (
                <Fragment key={r.id}>
                  <tr className="border-t hover:bg-muted/20">
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(r.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={isOpen ? '접기' : '펼치기'}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/contracts/${r.id}`} className="text-primary hover:underline">
                        {r.phase}차
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/contracts/${r.id}`} className="hover:underline">
                        {r.room_no}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                    <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                    <td className="px-3 py-2 font-mono">{formatDate(r.operation_end)}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-bold ${
                        isNegative ? 'text-destructive' : isSoon ? 'text-amber-600' : 'text-muted-foreground'
                      }`}
                    >
                      {isNegative ? `D+${Math.abs(r.days_left)}` : `D-${r.days_left}`}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t bg-muted/10">
                      <td></td>
                      <td colSpan={totalCols - 1} className="px-3 py-3">
                        <InlineContractEditor
                          row={r}
                          buyers={buyers}
                          onClose={() => toggleExpand(r.id)}
                          onSaved={() => { toggleExpand(r.id); router.refresh() }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description={emptyMessage} />
          </div>
        )}
      </div>
    </div>
  )
}
