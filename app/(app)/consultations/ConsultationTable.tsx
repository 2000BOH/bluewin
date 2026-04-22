'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/common/FormField'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import ConsultationForm from './ConsultationForm'
import { deleteConsultationAction } from './actions'
import { formatDate } from '@/lib/utils/format'
import type { ConsultationListItem } from '@/lib/queries/consultations'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

type BuyerOpt = { id: string; name1: string; buyer_no: string }

type Props = {
  rows: ConsultationListItem[]
  buyers: BuyerOpt[]
}

export default function ConsultationTable({ rows, buyers }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ConsultationListItem | null>(null)

  const [name, setName] = useState(params.get('buyer_name') ?? '')
  const [channel, setChannel] = useState(params.get('channel') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (name) sp.set('buyer_name', name)
    if (channel) sp.set('channel', channel)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (q) sp.set('q', q)
    startTransition(() => router.push(`/consultations?${sp.toString()}`))
  }
  const reset = () => {
    setName(''); setChannel(''); setFrom(''); setTo(''); setQ('')
    startTransition(() => router.push('/consultations'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 상담 기록을 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteConsultationAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="계약자명">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="채널">
            <TextInput value={channel} onChange={(e) => setChannel(e.target.value)} />
          </Field>
          <Field label="시작일">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="종료일">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="검색어">
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목/내용/결과" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            총 <span className="font-semibold text-foreground">{rows.length}</span>건
          </div>
          <div className="flex gap-2">
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
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">상담일</th>
              <th className="px-3 py-2 text-left">계약자</th>
              <th className="px-3 py-2 text-left">채널</th>
              <th className="px-3 py-2 text-left">제목</th>
              <th className="px-3 py-2 text-left">상담자</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2 font-mono">{formatDate(r.consult_date)}</td>
                <td className="px-3 py-2 font-medium">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{r.channel ?? '-'}</td>
                <td className="px-3 py-2">{r.title ?? '-'}</td>
                <td className="px-3 py-2">{r.consultant ?? '-'}</td>
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
            <EmptyState description="등록된 상담 기록이 없습니다." />
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="상담 등록" size="lg">
        <ConsultationForm
          mode="create"
          buyers={buyers}
          onSuccess={() => { setCreateOpen(false); router.refresh() }}
        />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="상담 수정" size="lg">
        {editTarget && (
          <ConsultationForm
            mode="edit"
            initial={editTarget}
            buyers={buyers}
            onSuccess={() => { setEditTarget(null); router.refresh() }}
          />
        )}
      </Modal>
    </div>
  )
}
