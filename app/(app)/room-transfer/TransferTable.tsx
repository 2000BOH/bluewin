'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextInput } from '@/components/common/FormField'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import TransferForm from './TransferForm'
import { deleteTransferAction } from './actions'
import { COMMON_STATUSES } from '@/types/status'
import { formatDate } from '@/lib/utils/format'
import type { TransferRow } from '@/lib/queries/room-transfer'
import { ArrowRight, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

type Props = { rows: TransferRow[] }

export default function TransferTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TransferRow | null>(null)

  const [fromPhase, setFromPhase] = useState(params.get('from_phase') ?? '')
  const [toPhase, setToPhase] = useState(params.get('to_phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [tenantName, setTenantName] = useState(params.get('tenant_name') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (fromPhase) sp.set('from_phase', fromPhase)
    if (toPhase) sp.set('to_phase', toPhase)
    if (roomNo) sp.set('room_no', roomNo)
    if (status) sp.set('status', status)
    if (tenantName) sp.set('tenant_name', tenantName)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    startTransition(() => router.push(`/room-transfer?${sp.toString()}`))
  }
  const reset = () => {
    setFromPhase(''); setToPhase(''); setRoomNo(''); setStatus('')
    setTenantName(''); setFrom(''); setTo('')
    startTransition(() => router.push('/room-transfer'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 이동 기록을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteTransferAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Field label="이동 전 차수">
            <TextInput type="number" min={1} value={fromPhase} onChange={(e) => setFromPhase(e.target.value)} />
          </Field>
          <Field label="이동 후 차수">
            <TextInput type="number" min={1} value={toPhase} onChange={(e) => setToPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="from/to 모두 검색" />
          </Field>
          <Field label="상태">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">전체</option>
              {COMMON_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="임차인">
            <TextInput value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </Field>
          <Field label="이동일 시작">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="이동일 종료">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">총 <span className="font-semibold text-foreground">{rows.length}</span>건</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화</Button>
            <Button size="sm" onClick={apply}><Search className="mr-1 h-3.5 w-3.5" /> 조회</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" /> 등록</Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">이동 전 → 이동 후</th>
              <th className="px-3 py-2 text-left">임차인명</th>
              <th className="px-3 py-2 text-left">이동일</th>
              <th className="px-3 py-2 text-left">사유</th>
              <th className="px-3 py-2 text-left">상태</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">{r.from_phase}차 → {r.to_phase}차</td>
                <td className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {r.from_room_no}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    {r.to_room_no}
                  </span>
                </td>
                <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                <td className="px-3 py-2 text-xs">{formatDate(r.transfer_date)}</td>
                <td className="px-3 py-2 max-w-xs truncate" title={r.reason ?? ''}>{r.reason ?? '-'}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
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
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-6"><EmptyState description="객실 이동 기록이 없습니다." /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="객실 이동 등록" size="lg">
        <TransferForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="객실 이동 수정" size="lg">
        {editTarget && (
          <TransferForm mode="edit" initial={editTarget} onSuccess={() => { setEditTarget(null); router.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
