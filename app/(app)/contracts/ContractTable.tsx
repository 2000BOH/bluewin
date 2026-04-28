'use client'

// 계약관리 목록.
// 검색: 차수 / 호수 / 숙박형태 / 운영방식 (계약형태 필터 제거).
// 행 우측 끝 펼치기 chevron → 펼치면 모든 계약 컬럼 + 인라인 수정 폼이 보인다.
// (기존 컬럼 펼치기 드롭다운은 제거 — 행 단위 펼치기로 대체.)

import { Fragment, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import { STAY_TYPES, OPERATION_TYPES } from '@/types/status'
import EmptyState from '@/components/common/EmptyState'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import { formatDate } from '@/lib/utils/format'
import type { ContractListItem } from '@/lib/queries/contracts'
import InlineContractEditor from './InlineContractEditor'
import { ChevronDown, ChevronRight, Plus, RefreshCw, Search } from 'lucide-react'
import { useRoomInput } from '@/hooks/useRoomInput'

type BuyerOption = { id: string; name1: string; buyer_no: string }
type Props = { rows: ContractListItem[]; buyerOptions: BuyerOption[] }

// 데스크톱 기본 컬럼 수: chevron(1) + 11개 + (액션 없음)
const BASE_COL_COUNT = 11

export default function ContractTable({ rows, buyerOptions }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [accType, setAccType] = useState<string>(params.get('accommodation_type') ?? '')
  const [opType, setOpType] = useState<string>(params.get('operation_type') ?? '')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const applyFetch = (p: string, r: string) => {
    const sp = new URLSearchParams()
    if (p) sp.set('phase', p)
    if (r) sp.set('room_no', r)
    if (opType) sp.set('operation_type', opType)
    if (accType) sp.set('accommodation_type', accType)
    startTransition(() => router.push(`/contracts?${sp.toString()}`))
  }

  const {
    phase,
    roomNo,
    roomNoRef,
    handlePhaseChange,
    handleRoomNoChange,
    handleRoomCompositionStart,
    handleRoomCompositionEnd,
  } = useRoomInput({
    initialPhase: params.get('phase') ?? '',
    initialRoomNo: params.get('room_no') ?? '',
    onAutoFetch: applyFetch,
  })

  const apply = () => applyFetch(phase, roomNo)
  const reset = () => {
    setOpType(''); setAccType('')
    applyFetch('', '')
  }
  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const totalCols = 1 + BASE_COL_COUNT // chevron + 11

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        {/* 한 행: 필터 4개 + 버튼 (모든 항목을 동일한 행에 배치) */}
        <div className="flex flex-wrap items-end gap-2">
          <Field label="차수" className="min-w-[110px] flex-1">
            <TextInput type="number" min={1} value={phase} placeholder="전체" onChange={handlePhaseChange} />
          </Field>
          <Field label="호수" className="min-w-[110px] flex-1">
            <TextInput ref={roomNoRef} value={roomNo} placeholder="전체" onChange={handleRoomNoChange} onCompositionStart={handleRoomCompositionStart} onCompositionEnd={handleRoomCompositionEnd} />
          </Field>
          <Field label="숙박형태" className="min-w-[140px] flex-1">
            <Select value={accType} onChange={(e) => setAccType(e.target.value)}>
              <option value="">전체</option>
              {STAY_TYPES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
          </Field>
          <Field label="운영방식" className="min-w-[140px] flex-1">
            <Select value={opType} onChange={(e) => setOpType(e.target.value)}>
              <option value="">전체</option>
              {OPERATION_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화
            </Button>
            <Button size="sm" onClick={apply}>
              <Search className="mr-1 h-3.5 w-3.5" /> 조회
            </Button>
            <Button size="sm" asChild>
              <Link href="/contracts/new"><Plus className="mr-1 h-3.5 w-3.5" /> 신규 등록</Link>
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{rows.length}</span>건
        </div>
      </div>

      {/* 모바일: 카드형 목록 — 카드 본문 클릭은 상세, 펼치기 버튼은 인라인 수정 토글 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="조회된 계약이 없습니다." />
          </div>
        ) : (
          rows.map((r) => {
            const isOpen = !!expanded[r.id]
            return (
              <div key={r.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/contracts/${r.id}`} className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-mono font-semibold">
                        {r.phase}차 {r.room_no}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.room_type ?? ''} {r.view_type ?? ''}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.buyer_name ?? '-'} · {r.tenant_name ?? '임차인 미지정'}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    <StayTypeBadge stayType={r.accommodation_type} size="sm" />
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
                      buyers={buyerOptions}
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
      <div className="hidden data-table-wrap sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-2 py-2 w-8"></th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-left">계약자명</th>
              <th className="px-3 py-2 text-left">운영종료일</th>
              <th className="px-3 py-2 text-left">비고(민원)</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">임대종료</th>
              <th className="px-3 py-2 text-left">임차인연락처</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = !!expanded[r.id]
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
                    <td className="px-3 py-2">{r.room_type ?? '-'}</td>
                    <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                    <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                    <td className="px-3 py-2">{formatDate(r.operation_end)}</td>
                    <td className="px-3 py-2 max-w-[14rem] truncate" title={r.note ?? ''}>
                      {r.note ?? ''}
                    </td>
                    <td className="px-3 py-2">
                      <StayTypeBadge stayType={r.accommodation_type} size="sm" />
                    </td>
                    <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                    <td className="px-3 py-2">{formatDate(r.lease_end)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.tenant_phone ?? '-'}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t bg-muted/10">
                      <td></td>
                      <td colSpan={totalCols - 1} className="px-3 py-3">
                        <InlineContractEditor
                          row={r}
                          buyers={buyerOptions}
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
            <EmptyState description="조회된 계약이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
