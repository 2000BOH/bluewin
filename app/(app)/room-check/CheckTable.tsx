'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextInput } from '@/components/common/FormField'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import CheckForm from './CheckForm'
import { deleteCheckAction } from './actions'
import { COMMON_STATUSES } from '@/types/status'
import { formatDate } from '@/lib/utils/format'
import type { CheckRow } from '@/lib/queries/room-check'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

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

  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [overall, setOverall] = useState(params.get('overall') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (status) sp.set('status', status)
    if (overall) sp.set('overall', overall)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    startTransition(() => router.push(`/room-check?${sp.toString()}`))
  }
  const reset = () => {
    setPhase(''); setRoomNo(''); setStatus(''); setOverall(''); setFrom(''); setTo('')
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
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="차수">
            <TextInput type="number" min={1} value={phase} onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
          <Field label="처리 상태">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">전체</option>
              {COMMON_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="전체 상태">
            <Select value={overall} onChange={(e) => setOverall(e.target.value)}>
              <option value="">전체</option>
              <option value="정상">정상</option>
              <option value="주의">주의</option>
              <option value="불량">불량</option>
            </Select>
          </Field>
          <Field label="점검일 시작">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="점검일 종료">
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
