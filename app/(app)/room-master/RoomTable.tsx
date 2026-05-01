'use client'

// 객실마스터 목록.
// 검색: 차수 / 호수 / 계약형태 / 숙박형태 / 운영방식 (계약형태·숙박형태·운영방식은 contracts 조인 필터)
// 행 우측 끝에 펼치기 아이콘 → 클릭 시 인라인 확장 → 모든 컬럼 표시 + "수정" 버튼으로 인라인 폼 편집.

import { Fragment, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import RoomForm from './RoomForm'
import InlineRoomEditor from './InlineRoomEditor'
import { deleteRoomAction } from './actions'
import { formatCurrency } from '@/lib/utils/format'
import { sumRoomTotals, type RoomWithContract } from '@/lib/queries/rooms'
import { STAY_TYPES, OPERATION_TYPES, type StayType } from '@/types/status'
import InlineStayTypeSelect from '@/components/common/InlineStayTypeSelect'
import { updateContractStayTypeAction } from '@/app/(app)/contracts/actions'
import { ChevronDown, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useRoomInput } from '@/hooks/useRoomInput'

type Props = { rows: RoomWithContract[]; canEdit: boolean }

const fmtNum = (v: number | null | undefined, digits = 2): string => {
  if (v === null || v === undefined) return ''
  return v.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

// 기본 표시 컬럼 수 (No, 차수, 호수, 타입, 조망, 숙박형태, 분양면적, VAT포함). 펼침 chevron 컬럼은 별도.
const BASE_COL_COUNT = 8

export default function RoomTable({ rows, canEdit }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [accType, setAccType] = useState<string>(params.get('accommodation_type') ?? '')
  const [opType, setOpType] = useState<string>(params.get('operation_type') ?? '')

  const applyFetch = (p: string, r: string) => {
    const sp = new URLSearchParams()
    if (p) sp.set('phase', p)
    if (r) sp.set('room_no', r)
    if (accType) sp.set('accommodation_type', accType)
    if (opType) sp.set('operation_type', opType)
    startTransition(() => router.push(`/room-master?${sp.toString()}`))
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
    setAccType(''); setOpType('')
    applyFetch('', '')
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 객실을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteRoomAction(fd)
      router.refresh()
    })
  }
  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const totals = sumRoomTotals(rows)
  // chevron(1) + 기본(7) + 액션(canEdit ? 1 : 0)
  const totalCols = 1 + BASE_COL_COUNT + (canEdit ? 1 : 0)

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
            <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화</Button>
            <Button size="sm" onClick={apply}><Search className="mr-1 h-3.5 w-3.5" /> 조회</Button>
            {canEdit && (
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" /> 등록</Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">총 <span className="font-semibold text-foreground">{rows.length}</span>실</div>
      </div>

      <div className="data-table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-2 py-2 w-8"></th>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-right">분양면적</th>
              <th className="px-3 py-2 text-right">VAT 포함</th>
              {canEdit && <th className="px-3 py-2 text-right">삭제</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
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
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2">{r.phase}차</td>
                    <td className="px-3 py-2 font-medium">{r.room_no}</td>
                    <td className="px-3 py-2">{r.type ?? '-'}</td>
                    <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                    <td className="px-3 py-2">
                      {r.contract_id ? (
                        <InlineStayTypeSelect stayType={r.accommodation_type} size="sm"
                          onChange={(next) => updateContractStayTypeAction(r.contract_id!, next as StayType | null)} />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{fmtNum(r.sale_area)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sale_price_incl_vat)}</td>
                    {canEdit && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {isOpen && (
                    <tr className="border-t bg-muted/10">
                      <td></td>
                      <td colSpan={totalCols - 1} className="px-3 py-3">
                        {canEdit ? (
                          <InlineRoomEditor
                            row={r}
                            onClose={() => toggleExpand(r.id)}
                            onSaved={() => { toggleExpand(r.id); router.refresh() }}
                          />
                        ) : (
                          <ReadOnlyRoomDetail row={r} />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-muted/30 text-xs">
              <tr className="border-t-2">
                <td />
                <td colSpan={6} className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.sale_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(totals.sale_price_incl_vat)}</td>
                {canEdit && <td />}
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && <div className="p-6"><EmptyState description="등록된 객실이 없습니다." /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="객실 등록" size="lg">
        <RoomForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
    </div>
  )
}

// 권한 없는 사용자(일반직원)가 펼쳤을 때의 read-only 상세 뷰.
function ReadOnlyRoomDetail({ row }: { row: RoomWithContract }) {
  const items: Array<[string, string]> = [
    ['대지', fmtNum(row.land_area)],
    ['전유', fmtNum(row.exclusive_area)],
    ['일부공용', fmtNum(row.partial_common_area)],
    ['기타공용', fmtNum(row.other_common_area)],
    ['주차공용', fmtNum(row.parking_common_area)],
    ['전유율', fmtNum(row.exclusive_ratio)],
    ['테라스', row.has_terrace ? '○' : '-'],
    ['다락', row.has_attic ? '○' : '-'],
    ['VAT 제외', formatCurrency(row.sale_price_excl_vat)],
    ['VAT 포함', formatCurrency(row.sale_price_incl_vat)],
  ]
  return (
    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-5">
      {items.map(([k, v]) => (
        <div key={k} className="rounded border bg-background px-2 py-1.5">
          <div className="text-muted-foreground">{k}</div>
          <div className="font-mono">{v || '-'}</div>
        </div>
      ))}
    </div>
  )
}
