'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import BuyerForm from './BuyerForm'
import { deleteBuyerAction } from './actions'
import type { BuyerRow, BuyerContractCount } from '@/lib/queries/buyers'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

type Props = {
  rows: BuyerRow[]
  counts: Record<string, BuyerContractCount>
}

export default function BuyerTable({ rows, counts }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BuyerRow | null>(null)

  const [buyerNo, setBuyerNo] = useState(params.get('buyer_no') ?? '')
  const [buyerType, setBuyerType] = useState(params.get('buyer_type') ?? '')
  const [name, setName] = useState(params.get('name') ?? '')
  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (buyerNo) sp.set('buyer_no', buyerNo)
    if (buyerType) sp.set('buyer_type', buyerType)
    if (name) sp.set('name', name)
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    startTransition(() => router.push(`/buyers?${sp.toString()}`))
  }
  const reset = () => {
    setBuyerNo(''); setBuyerType(''); setName(''); setPhase(''); setRoomNo('')
    startTransition(() => router.push('/buyers'))
  }
  const handleDelete = (id: string) => {
    if (!confirm('이 수분양자를 삭제하시겠습니까?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteBuyerAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="계약자번호">
            <TextInput value={buyerNo} onChange={(e) => setBuyerNo(e.target.value)} />
          </Field>
          <Field label="개인/법인">
            <Select value={buyerType} onChange={(e) => setBuyerType(e.target.value)}>
              <option value="">전체</option>
              <option value="개인">개인</option>
              <option value="법인">법인</option>
            </Select>
          </Field>
          <Field label="계약자명">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="차수">
            <TextInput type="number" min={1} value={phase} onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            총 <span className="font-semibold text-foreground">{rows.length}</span>명
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

      {/* 모바일: 카드형 목록 */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="등록된 수분양자가 없습니다." />
          </div>
        ) : (
          rows.map((b, idx) => {
            const c = counts[b.id] ?? { active: 0, ended: 0 }
            return (
              <div key={b.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                      <span className="font-mono text-xs">{b.buyer_no}</span>
                      <span className="rounded bg-muted px-1.5 text-[11px]">
                        {b.buyer_type}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {b.name1}
                      {b.name2 ? ` / ${b.name2}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(b)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">계약중</div>
                    <div className="font-mono font-semibold">{c.active}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">해지</div>
                    <div className="font-mono text-muted-foreground">{c.ended}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">연락처</div>
                    <div className="font-mono">{b.phone1 ?? '-'}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">계약자번호</th>
              <th className="px-3 py-2 text-left">개인/법인</th>
              <th className="px-3 py-2 text-left">계약자명</th>
              <th className="px-3 py-2 text-right">계약중 호수</th>
              <th className="px-3 py-2 text-right">계약해지 호수</th>
              <th className="px-3 py-2 text-left">연락처</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, idx) => {
              const c = counts[b.id] ?? { active: 0, ended: 0 }
              return (
                <tr key={b.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono">{b.buyer_no}</td>
                  <td className="px-3 py-2">{b.buyer_type}</td>
                  <td className="px-3 py-2 font-medium">
                    {b.name1}
                    {b.name2 ? ` / ${b.name2}` : ''}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{c.active}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">{c.ended}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.phone1 ?? '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTarget(b)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
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
            <EmptyState description="등록된 수분양자가 없습니다." />
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="수분양자 등록" size="lg">
        <BuyerForm mode="create" onSuccess={() => { setCreateOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="수분양자 수정" size="lg">
        {editTarget && (
          <BuyerForm
            mode="edit"
            initial={editTarget}
            onSuccess={() => { setEditTarget(null); router.refresh() }}
          />
        )}
      </Modal>
    </div>
  )
}
