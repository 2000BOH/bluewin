'use client'

// 영선 요청 목록 + 필터 + 등록/수정/삭제 모달.
// 서버 컴포넌트(MaintenancePage)에서 초기 rows 를 props 로 받아 렌더한다.

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextInput } from '@/components/common/FormField'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import MaintenanceForm from './MaintenanceForm'
import { deleteMaintenanceAction } from './actions'
import { COMMON_STATUSES, URGENCY_LEVELS } from '@/types/status'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

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

  // 필터 입력 상태 (URL 쿼리에서 초기화).
  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [urgency, setUrgency] = useState(params.get('urgency') ?? '')
  const [assignedTo, setAssignedTo] = useState(params.get('assigned_to') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')

  const applyFilter = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (status) sp.set('status', status)
    if (urgency) sp.set('urgency', urgency)
    if (assignedTo) sp.set('assigned_to', assignedTo)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (q) sp.set('q', q)
    startTransition(() => router.push(`/maintenance?${sp.toString()}`))
  }

  const resetFilter = () => {
    setPhase('')
    setRoomNo('')
    setStatus('')
    setUrgency('')
    setAssignedTo('')
    setFrom('')
    setTo('')
    setQ('')
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

  const total = rows.length
  const completed = useMemo(() => rows.filter((r) => r.status === '완료').length, [rows])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Field label="차수">
            <TextInput type="number" min={1} value={phase} onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
          <Field label="상태">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">전체</option>
              {COMMON_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="긴급도">
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="">전체</option>
              {URGENCY_LEVELS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="담당자">
            <TextInput value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
          </Field>
          <Field label="요청일 시작">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="요청일 종료">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="제목/내용">
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="키워드" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            총 <span className="font-semibold text-foreground">{total}</span>건 · 완료{' '}
            <span className="font-semibold text-foreground">{completed}</span>건
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetFilter}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화
            </Button>
            <Button size="sm" onClick={applyFilter}>
              <Search className="mr-1 h-3.5 w-3.5" /> 조회
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일: 카드형 목록 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="조건에 맞는 영선 요청이 없습니다." />
          </div>
        ) : (
          rows.map((r, idx) => (
            <div key={r.id} className="rounded-lg border bg-card p-3">
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
                <StatusBadge status={r.status} size="sm" />
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
          ))
        )}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">제목</th>
              <th className="px-3 py-2 text-left">요청자</th>
              <th className="px-3 py-2 text-left">긴급도</th>
              <th className="px-3 py-2 text-left">상태</th>
              <th className="px-3 py-2 text-left">담당자</th>
              <th className="px-3 py-2 text-left">출처</th>
              <th className="px-3 py-2 text-left">접수일</th>
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
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.requester ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${URGENCY_DOT[r.urgency]}`} />
                    {r.urgency}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2">{r.assigned_to ?? '-'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.source}</td>
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
            ))}
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
