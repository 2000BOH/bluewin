'use client'

// 영선 요청 목록 + 필터 + 등록/수정/삭제 모달.
// 서버 컴포넌트(MaintenancePage)에서 초기 rows 를 props 로 받아 렌더한다.

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RoomFilterBar from '@/components/common/RoomFilterBar'
import InlineStatusSelect from '@/components/common/InlineStatusSelect'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import RowActionCell from '@/components/common/RowActionCell'
import PhotoStrip from '@/components/common/PhotoStrip'
import MaintenanceForm from './MaintenanceForm'
import { deleteMaintenanceAction, updateMaintenanceStatusAction } from './actions'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import {
  rowFlagClass,
  sortByFlag,
  useRowFlags,
} from '@/lib/hooks/useRowFlags'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Props = { rows: MaintenanceRow[] }

const URGENCY_DOT: Record<string, string> = {
  긴급: 'bg-red-500',
  일반: 'bg-blue-400',
  낮음: 'bg-gray-400',
}

export default function MaintenanceTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MaintenanceRow | null>(null)

  // 필터 상태 (URL 쿼리에서 초기화)
  const [done,      setDone]      = useState(params.get('done') ?? '')
  const [requester, setRequester] = useState(params.get('requester') ?? '')
  const [status,    setStatus]    = useState(params.get('status') ?? '')
  const [from,      setFrom]      = useState(params.get('from') ?? '')
  const [to,        setTo]        = useState(params.get('to') ?? '')

  const applyFilter = () => {
    const sp = new URLSearchParams()
    if (done)      sp.set('done',      done)
    if (requester) sp.set('requester', requester)
    if (status)    sp.set('status',    status)
    if (from)      sp.set('from',      from)
    if (to)        sp.set('to',        to)
    startTransition(() => router.push(`/maintenance?${sp.toString()}`))
  }

  const resetFilter = () => {
    setDone(''); setRequester(''); setStatus(''); setFrom(''); setTo('')
    startTransition(() => router.push('/maintenance'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 요청을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteMaintenanceAction(fd)
      router.refresh()
    })
  }

  const { flagsOf, togglePriority, toggleDone, prioritySnapshot } =
    useRowFlags('maintenance')
  const sortedRows = useMemo(
    () => sortByFlag(rows, prioritySnapshot),
    [rows, prioritySnapshot],
  )

  const total = rows.length
  const completed = useMemo(() => rows.filter((r) => r.status === '완료').length, [rows])

  return (
    <div className="space-y-4">
      <RoomFilterBar
        done={done}           onDoneChange={setDone}
        receiverLabel="접수자"
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

      {/* 모바일: 카드형 목록 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="조건에 맞는 영선 요청이 없습니다." />
          </div>
        ) : (
          sortedRows.map((r, idx) => {
            const flags = flagsOf(r.id)
            return (
            <div
              key={r.id}
              className={`rounded-lg border bg-card p-3 ${
                flags.priority && !flags.done ? 'ring-1 ring-amber-300/70 bg-amber-50' : ''
              } ${flags.done ? 'opacity-40 bg-muted/60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    <span className="font-mono text-xs">
                      {r.phase}차 {r.room_no}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <span className={`h-2 w-2 rounded-full ${URGENCY_DOT[r.urgency]}`} />
                      {r.urgency}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium line-clamp-2">{r.title}</div>
                </div>
                <InlineStatusSelect
                  status={r.status}
                  size="sm"
                  onChange={(next) => updateMaintenanceStatusAction(r.id, next)}
                />
              </div>
              <div className="mt-2">
                <RowActionCell
                  priority={flags.priority}
                  done={flags.done}
                  onPriority={() => togglePriority(r.id)}
                  onDone={() => toggleDone(r.id)}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">요청자</div>
                  <div>{r.requester ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">담당자</div>
                  <div>{r.assigned_to ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">접수일</div>
                  <div className="font-mono">{formatDate(r.request_date)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">완료일</div>
                  <div className="font-mono">
                    {r.completed_at ? formatDateTime(r.completed_at) : '-'}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="text-[11px] text-muted-foreground">출처: {r.source}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditTarget(r)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">
                <span className="inline-flex items-center gap-2">
                  <span className="w-6 text-center">우선</span>
                  <span className="text-[11px] text-muted-foreground">완료</span>
                </span>
              </th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">제목</th>
              <th className="px-3 py-2 text-left">요청자</th>
              <th className="px-3 py-2 text-left">긴급도</th>
              <th className="px-3 py-2 !text-center">상태</th>
              <th className="px-3 py-2 text-left">담당자</th>
              <th className="px-3 py-2 text-left">출처</th>
              <th className="px-3 py-2 text-left">사진</th>
              <th className="px-3 py-2 text-left">접수일</th>
              <th className="px-3 py-2 text-left">완료일</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r, idx) => {
              const flags = flagsOf(r.id)
              return (
              <tr key={r.id} className={`border-t ${rowFlagClass(flags)}`}>
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2">
                  <RowActionCell
                    priority={flags.priority}
                    done={flags.done}
                    onPriority={() => togglePriority(r.id)}
                    onDone={() => toggleDone(r.id)}
                  />
                </td>
                <td className="px-3 py-2">{r.phase}차</td>
                <td className="px-3 py-2 font-medium">{r.room_no}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.requester ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${URGENCY_DOT[r.urgency]}`} />
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <InlineStatusSelect
                    status={r.status}
                    onChange={(next) => updateMaintenanceStatusAction(r.id, next)}
                  />
                </td>
                <td className="px-3 py-2">{r.assigned_to ?? '-'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.source}</td>
                <td className="px-3 py-2">
                  <PhotoStrip photos={(r.photos as unknown as string[]) ?? []} />
                </td>
                <td className="px-3 py-2 text-xs">{formatDate(r.request_date)}</td>
                <td className="px-3 py-2 text-xs">{formatDateTime(r.completed_at)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(r)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
              </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="조건에 맞는 영선 요청이 없습니다." />
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="영선 요청 등록"
        size="lg"
      >
        <MaintenanceForm
          mode="create"
          onSuccess={() => {
            setCreateOpen(false)
            router.refresh()
          }}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="영선 요청 수정"
        size="lg"
      >
        {editTarget && (
          <MaintenanceForm
            mode="edit"
            initial={editTarget}
            onSuccess={() => {
              setEditTarget(null)
              router.refresh()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
