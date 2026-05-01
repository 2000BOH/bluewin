'use client'

// 입주지원 목록 테이블.

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RoomFilterBar from '@/components/common/RoomFilterBar'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import MoveInForm from './MoveInForm'
import { deleteMoveInAction } from './actions'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const URGENCY_DOT: Record<string, string> = {
  긴급: 'bg-red-500',
  일반: 'bg-blue-400',
  낮음: 'bg-gray-400',
}

type Props = { rows: MaintenanceRow[] }

export default function MoveInTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MaintenanceRow | null>(null)

  const [done,      setDone]      = useState(params.get('done') ?? '')
  const [requester, setRequester] = useState(params.get('requester') ?? '')
  const [status,    setStatus]    = useState(params.get('status') ?? '')
  const [from,      setFrom]      = useState(params.get('from') ?? '')
  const [to,        setTo]        = useState(params.get('to') ?? '')

  const applyFilter = () => {
    const sp = new URLSearchParams()
    if (done)      sp.set('done', done)
    if (requester) sp.set('requester', requester)
    if (status)    sp.set('status', status)
    if (from)      sp.set('from', from)
    if (to)        sp.set('to', to)
    startTransition(() => router.push(`/maintenance/move-in?${sp.toString()}`))
  }
  const resetFilter = () => {
    setDone(''); setRequester(''); setStatus(''); setFrom(''); setTo('')
    startTransition(() => router.push('/maintenance/move-in'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 입주지원 기록을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => { await deleteMoveInAction(fd); router.refresh() })
  }

  const total     = rows.length
  const completed = useMemo(() => rows.filter((r) => r.status === '완료').length, [rows])

  return (
    <div className="space-y-4">
      <RoomFilterBar
        done={done}           onDoneChange={setDone}
        receiverLabel="요청자"
        receiver={requester}  onReceiverChange={setRequester}
        status={status}       onStatusChange={setStatus}
        dateFrom={from}       onDateFromChange={setFrom}
        dateTo={to}           onDateToChange={setTo}
        onSearch={applyFilter}
        onReset={resetFilter}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          총 <span className="font-semibold text-foreground">{total}</span>건 · 완료{' '}
          <span className="font-semibold text-foreground">{completed}</span>건
        </span>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> 등록
        </Button>
      </div>

      {/* 모바일: 카드형 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-card p-6">
            <EmptyState description="입주지원 기록이 없습니다." />
          </div>
        ) : rows.map((r, idx) => (
          <div key={r.id} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <span className="font-mono text-xs">{r.phase}차 {r.room_no}</span>
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${URGENCY_DOT[r.urgency]}`} />
                    {r.urgency}
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium line-clamp-2">{r.title}</div>
              </div>
              <StatusBadge status={r.status} size="sm" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">요청자</span><div>{r.requester ?? '-'}</div></div>
              <div><span className="text-muted-foreground">담당자</span><div>{r.assigned_to ?? '-'}</div></div>
              <div><span className="text-muted-foreground">요청일</span><div className="font-mono">{formatDate(r.request_date)}</div></div>
              <div><span className="text-muted-foreground">완료일</span><div className="font-mono">{formatDateTime(r.completed_at)}</div></div>
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <button type="button" onClick={() => setEditTarget(r)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => handleDelete(r.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden data-table-wrap sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">No</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">차수</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">호수</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">제목</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">요청자</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">긴급도</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">상태</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">담당자</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">요청일</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground">완료일시</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2 max-w-[200px] truncate" title={r.title ?? ''}>{r.title ?? '-'}</td>
                <td className="px-3 py-2">{r.requester ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${URGENCY_DOT[r.urgency]}`} />
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2">{r.assigned_to ?? '-'}</td>
                <td className="px-3 py-2 text-xs">{formatDate(r.request_date)}</td>
                <td className="px-3 py-2 text-xs">{formatDateTime(r.completed_at)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => setEditTarget(r)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(r.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="삭제">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6"><EmptyState description="입주지원 기록이 없습니다." /></div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="입주지원 등록" size="lg">
        <MoveInForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="입주지원 수정" size="lg">
        {editTarget && (
          <MoveInForm mode="edit" initial={editTarget}
            onSuccess={() => { setEditTarget(null); router.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
