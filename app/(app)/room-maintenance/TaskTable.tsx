'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RoomFilterBar from '@/components/common/RoomFilterBar'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import TaskForm from './TaskForm'
import { deleteTaskAction } from './actions'
import { type TaskRow } from '@/lib/queries/room-maintenance-task'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Props = { rows: TaskRow[] }

export default function TaskTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TaskRow | null>(null)

  const [done,      setDone]      = useState(params.get('done') ?? '')
  const [requester, setRequester] = useState(params.get('requester') ?? '')
  const [status,    setStatus]    = useState(params.get('status') ?? '')
  const [from,      setFrom]      = useState(params.get('from') ?? '')
  const [to,        setTo]        = useState(params.get('to') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (done)      sp.set('done',      done)
    if (requester) sp.set('requester', requester)
    if (status)    sp.set('status',    status)
    if (from)      sp.set('from',      from)
    if (to)        sp.set('to',        to)
    startTransition(() => router.push(`/room-maintenance?${sp.toString()}`))
  }
  const reset = () => {
    setDone(''); setRequester(''); setStatus(''); setFrom(''); setTo('')
    startTransition(() => router.push('/room-maintenance'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 정비 기록을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteTaskAction(fd)
      router.refresh()
    })
  }

  const totalCost = rows.reduce((acc, r) => acc + (r.cost ?? 0), 0)

  return (
    <div className="space-y-4">
      <RoomFilterBar
        done={done}           onDoneChange={setDone}
        receiverLabel="접수자"
        receiver={requester}  onReceiverChange={setRequester}
        status={status}       onStatusChange={setStatus}
        dateFrom={from}       onDateFromChange={setFrom}
        dateTo={to}           onDateToChange={setTo}
        onSearch={apply}
        onReset={reset}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          총 <span className="font-semibold text-foreground">{rows.length}</span>건 · 비용 합계{' '}
          <span className="font-semibold text-foreground">{formatCurrency(totalCost)}</span>원
        </span>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> 등록
        </Button>
      </div>

      <div className="data-table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">정비유형</th>
              <th className="px-3 py-2 text-left">내용</th>
              <th className="px-3 py-2 text-left">요청자</th>
              <th className="px-3 py-2 text-left">담당자</th>
              <th className="px-3 py-2 text-left">상태</th>
              <th className="px-3 py-2 text-right">비용</th>
              <th className="px-3 py-2 text-left">요청일</th>
              <th className="px-3 py-2 text-left">완료일</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2">{r.maintenance_type}</td>
                <td className="px-3 py-2 max-w-xs truncate" title={r.content ?? ''}>{r.content ?? '-'}</td>
                <td className="px-3 py-2">{r.requester ?? '-'}</td>
                <td className="px-3 py-2">{r.assigned_to ?? '-'}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.cost) || '-'}</td>
                <td className="px-3 py-2 text-xs">{formatDate(r.request_date)}</td>
                <td className="px-3 py-2 text-xs">{formatDateTime(r.completed_at)}</td>
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
        {rows.length === 0 && <div className="p-6"><EmptyState description="등록된 정비 기록이 없습니다." /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="객실 정비 등록" size="lg">
        <TaskForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="객실 정비 수정" size="lg">
        {editTarget && (
          <TaskForm mode="edit" initial={editTarget} onSuccess={() => { setEditTarget(null); router.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
