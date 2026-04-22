'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/common/FormField'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import RoomForm from './RoomForm'
import { deleteRoomAction } from './actions'
import { formatCurrency } from '@/lib/utils/format'
import { sumRoomTotals, type RoomRow } from '@/lib/queries/rooms'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

type Props = { rows: RoomRow[]; canEdit: boolean }

const fmtNum = (v: number | null | undefined, digits = 2): string => {
  if (v === null || v === undefined) return ''
  return v.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

export default function RoomTable({ rows, canEdit }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RoomRow | null>(null)

  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [type, setType] = useState(params.get('type') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (type) sp.set('type', type)
    startTransition(() => router.push(`/room-master?${sp.toString()}`))
  }
  const reset = () => {
    setPhase(''); setRoomNo(''); setType('')
    startTransition(() => router.push('/room-master'))
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

  const totals = sumRoomTotals(rows)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="차수">
            <TextInput type="number" min={1} value={phase} onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
          <Field label="타입">
            <TextInput value={type} onChange={(e) => setType(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">총 <span className="font-semibold text-foreground">{rows.length}</span>실</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화</Button>
            <Button size="sm" onClick={apply}><Search className="mr-1 h-3.5 w-3.5" /> 조회</Button>
            {canEdit && (
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" /> 등록</Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-right">대지</th>
              <th className="px-3 py-2 text-right">전유</th>
              <th className="px-3 py-2 text-right">일부공용</th>
              <th className="px-3 py-2 text-right">기타공용</th>
              <th className="px-3 py-2 text-right">주차공용</th>
              <th className="px-3 py-2 text-right">분양면적</th>
              <th className="px-3 py-2 text-right">전유율</th>
              <th className="px-3 py-2 text-center">테라스</th>
              <th className="px-3 py-2 text-center">다락</th>
              <th className="px-3 py-2 text-right">VAT 제외</th>
              <th className="px-3 py-2 text-right">VAT 포함</th>
              {canEdit && <th className="px-3 py-2 text-right">액션</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2">{r.type ?? '-'}</td>
                <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.land_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.exclusive_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.partial_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.other_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.parking_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.sale_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(r.exclusive_ratio)}</td>
                <td className="px-3 py-2 text-center">{r.has_terrace ? '○' : '-'}</td>
                <td className="px-3 py-2 text-center">{r.has_attic ? '○' : '-'}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sale_price_excl_vat)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.sale_price_incl_vat)}</td>
                {canEdit && (
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditTarget(r)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="수정">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(r.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="삭제">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-muted/30 text-xs">
              <tr className="border-t-2">
                <td colSpan={5} className="px-3 py-2 font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.land_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.exclusive_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.partial_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.other_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.parking_common_area)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtNum(totals.sale_area)}</td>
                <td colSpan={3} />
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(totals.sale_price_excl_vat)}</td>
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
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="객실 수정" size="lg">
        {editTarget && (
          <RoomForm mode="edit" initial={editTarget} onSuccess={() => { setEditTarget(null); router.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
