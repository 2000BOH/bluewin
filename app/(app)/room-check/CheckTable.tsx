'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RoomFilterBar from '@/components/common/RoomFilterBar'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import CheckForm from './CheckForm'
import { deleteCheckAction } from './actions'
import { formatDate } from '@/lib/utils/format'
import type { CheckRow } from '@/lib/queries/room-check'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const OVERALL_COLOR: Record<string, string> = {
  정상: 'text-green-600',
  주의: 'text-yellow-600',
  불량: 'text-red-600',
}

type Props = { rows: CheckRow[] }

export default function CheckTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CheckRow | null>(null)

  const [done,      setDone]      = useState(params.get('done') ?? '')
  const [requester, setRequester] = useState(params.get('checker') ?? '')
  const [status,    setStatus]    = useState(params.get('status') ?? '')
  const [from,      setFrom]      = useState(params.get('from') ?? '')
  const [to,        setTo]        = useState(params.get('to') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (done)      sp.set('done',    done)
    if (requester) sp.set('checker', requester)
    if (status)    sp.set('status',  status)
    if (from)      sp.set('from',    from)
    if (to)        sp.set('to',      to)
    startTransition(() => router.push(`/room-check?${sp.toString()}`))
  }
  const reset = () => {
    setDone(''); setRequester(''); setStatus(''); setFrom(''); setTo('')
    startTransition(() => router.push('/room-check'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 체크 기록을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteCheckAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <RoomFilterBar
        done={done}           onDoneChange={setDone}
        receiverLabel="점검자"
        receiver={requester}  onReceiverChange={setRequester}
        status={status}       onStatusChange={setStatus}
        dateFrom={from}       onDateFromChange={setFrom}
        dateTo={to}           onDateToChange={setTo}
        onSearch={apply}
        onReset={reset}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>총 <span className="font-semibold text-foreground">{rows.length}</span>건</span>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> 등록
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">점검일</th>
              <th className="px-3 py-2 text-left">점검자</th>
              <th className="px-3 py-2 text-left">전체상태</th>
              <th className="px-3 py-2 text-left">특이사항</th>
              <th className="px-3 py-2 text-left">다음점검</th>
              <th className="px-3 py-2 text-left">처리상태</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2 text-xs">{formatDate(r.check_date)}</td>
                <td className="px-3 py-2">{r.checker ?? '-'}</td>
                <td className={`px-3 py-2 font-medium ${OVERALL_COLOR[r.overall_status]}`}>
                  {r.overall_status}
                </td>
                <td className="px-3 py-2 max-w-xs truncate" title={r.special_notes ?? ''}>
                  {r.special_notes ?? '-'}
                </td>
                <td className="px-3 py-2 text-xs">{formatDate(r.next_check_date)}</td>
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
        {rows.length === 0 && <div className="p-6"><EmptyState description="등록된 체크 기록이 없습니다." /></div>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="객실 체크 등록" size="lg">
        <CheckForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="객실 체크 수정" size="lg">
        {editTarget && (
          <CheckForm mode="edit" initial={editTarget} onSuccess={() => { setEditTarget(null); router.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
