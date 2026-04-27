'use client'

// 수분양자(소유주) 마스터 목록.
// 검색: 차수 / 호수 / 계약형태 / 숙박형태 / 운영방식 + 소유주(이름) 검색창.
// 행 우측 끝에 펼치기 아이콘 → 클릭 시 인라인 확장 → 모든 필드 표시 + "수정" 버튼으로 인라인 폼 편집.

import { Fragment, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import BuyerForm from './BuyerForm'
import InlineBuyerEditor from './InlineBuyerEditor'
import { deleteBuyerAction } from './actions'
import type { BuyerRow, BuyerContractCount } from '@/lib/queries/buyers'
import { STAY_TYPES, OPERATION_TYPES } from '@/types/status'
import { ChevronDown, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

type Props = {
  rows: BuyerRow[]
  counts: Record<string, BuyerContractCount>
}

// 데스크톱 기본 컬럼 수: No, 계약자번호, 개인/법인, 계약자명, 계약중, 해지, 연락처 (7)
const BASE_COL_COUNT = 7

export default function BuyerTable({ rows, counts }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [accType, setAccType] = useState(params.get('accommodation_type') ?? '')
  const [opType, setOpType] = useState(params.get('operation_type') ?? '')
  const [name, setName] = useState(params.get('name') ?? '') // 소유주(계약자명) 검색

  const apply = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (accType) sp.set('accommodation_type', accType)
    if (opType) sp.set('operation_type', opType)
    if (name) sp.set('name', name)
    startTransition(() => router.push(`/buyers?${sp.toString()}`))
  }
  const reset = () => {
    setPhase(''); setRoomNo(''); setAccType(''); setOpType(''); setName('')
    startTransition(() => router.push('/buyers'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 수분양자를 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteBuyerAction(fd)
      router.refresh()
    })
  }
  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }))

  // chevron(1) + 기본(7) + 액션(삭제 1)
  const totalCols = 1 + BASE_COL_COUNT + 1

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        {/* 한 행: 필터 5개 + 버튼 (모든 항목을 동일한 행에 배치) */}
        <div className="flex flex-wrap items-end gap-2">
          <Field label="차수" className="min-w-[100px] flex-1">
            <TextInput type="number" min={1} value={phase} placeholder="전체" onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수" className="min-w-[100px] flex-1">
            <TextInput value={roomNo} placeholder="전체" onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
          <Field label="숙박형태" className="min-w-[130px] flex-1">
            <Select value={accType} onChange={(e) => setAccType(e.target.value)}>
              <option value="">전체</option>
              {STAY_TYPES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
          </Field>
          <Field label="운영방식" className="min-w-[130px] flex-1">
            <Select value={opType} onChange={(e) => setOpType(e.target.value)}>
              <option value="">전체</option>
              {OPERATION_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="소유주" className="min-w-[140px] flex-1">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') apply() }}
              placeholder="계약자명"
            />
          </Field>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화
            </Button>
            <Button size="sm" onClick={apply}>
              <Search className="mr-1 h-3.5 w-3.5" /> 조회
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> 등록
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{rows.length}</span>명
        </div>
      </div>

      {/* 모바일: 카드형 목록 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="등록된 수분양자가 없습니다." />
          </div>
        ) : (
          rows.map((b, idx) => {
            const c = counts[b.id] ?? { active: 0, ended: 0 }
            const isOpen = !!expanded[b.id]
            return (
              <div key={b.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                      <span className="font-mono text-xs">{b.buyer_no}</span>
                      <span className="rounded bg-muted px-1.5 text-[11px]">
                        {b.buyer_type}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {b.name1}
                      {b.name2 ? ` / ${b.name2}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(b.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={isOpen ? '접기' : '펼치기'}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">계약중</div>
                    <div className="font-mono font-semibold">{c.active}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">해지</div>
                    <div className="font-mono text-muted-foreground">{c.ended}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">연락처</div>
                    <div className="font-mono">{b.phone1 ?? '-'}</div>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 border-t pt-3">
                    <InlineBuyerEditor
                      row={b}
                      onClose={() => toggleExpand(b.id)}
                      onSaved={() => { toggleExpand(b.id); router.refresh() }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden data-table-wrap sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-2 py-2 w-8"></th>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">계약자번호</th>
              <th className="px-3 py-2 text-left">개인/법인</th>
              <th className="px-3 py-2 text-left">계약자명</th>
              <th className="px-3 py-2 text-right">계약중 호수</th>
              <th className="px-3 py-2 text-right">계약해지 호수</th>
              <th className="px-3 py-2 text-left">연락처</th>
              <th className="px-3 py-2 text-right">삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, idx) => {
              const c = counts[b.id] ?? { active: 0, ended: 0 }
              const isOpen = !!expanded[b.id]
              return (
                <Fragment key={b.id}>
                  <tr className="border-t hover:bg-muted/20">
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(b.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={isOpen ? '접기' : '펼치기'}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono">{b.buyer_no}</td>
                    <td className="px-3 py-2">{b.buyer_type}</td>
                    <td className="px-3 py-2 font-medium">
                      {b.name1}
                      {b.name2 ? ` / ${b.name2}` : ''}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{c.active}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{c.ended}</td>
                    <td className="px-3 py-2 font-mono text-xs">{b.phone1 ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t bg-muted/10">
                      <td></td>
                      <td colSpan={totalCols - 1} className="px-3 py-3">
                        <InlineBuyerEditor
                          row={b}
                          onClose={() => toggleExpand(b.id)}
                          onSaved={() => { toggleExpand(b.id); router.refresh() }}
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
            <EmptyState description="등록된 수분양자가 없습니다." />
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="수분양자 등록" size="lg">
        <BuyerForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
    </div>
  )
}
