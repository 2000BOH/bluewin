'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/format'
import type { ContractListItem } from '@/lib/queries/contracts'
import { Plus, RefreshCw, Search } from 'lucide-react'

type Props = { rows: ContractListItem[] }

export default function ContractTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [viewType, setViewType] = useState(params.get('view_type') ?? '')
  const [buyerName, setBuyerName] = useState(params.get('buyer_name') ?? '')
  const [reverse, setReverse] = useState(params.get('reverse_issuance') ?? '')
  const [opType, setOpType] = useState(params.get('operation_type') ?? '')
  const [cForm, setCForm] = useState(params.get('contract_form') ?? '')
  const [accType, setAccType] = useState(params.get('accommodation_type') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (viewType) sp.set('view_type', viewType)
    if (buyerName) sp.set('buyer_name', buyerName)
    if (reverse) sp.set('reverse_issuance', reverse)
    if (opType) sp.set('operation_type', opType)
    if (cForm) sp.set('contract_form', cForm)
    if (accType) sp.set('accommodation_type', accType)
    startTransition(() => router.push(`/contracts?${sp.toString()}`))
  }
  const reset = () => {
    setPhase(''); setRoomNo(''); setViewType(''); setBuyerName('')
    setReverse(''); setOpType(''); setCForm(''); setAccType('')
    startTransition(() => router.push('/contracts'))
  }

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
          <Field label="조망">
            <TextInput value={viewType} onChange={(e) => setViewType(e.target.value)} />
          </Field>
          <Field label="계약자명">
            <TextInput value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          </Field>
          <Field label="역발행">
            <Select value={reverse} onChange={(e) => setReverse(e.target.value)}>
              <option value="">전체</option>
              <option value="true">역발행</option>
              <option value="false">정발행</option>
            </Select>
          </Field>
          <Field label="운영방식">
            <TextInput value={opType} onChange={(e) => setOpType(e.target.value)} />
          </Field>
          <Field label="계약형태">
            <TextInput value={cForm} onChange={(e) => setCForm(e.target.value)} />
          </Field>
          <Field label="숙박형태">
            <TextInput value={accType} onChange={(e) => setAccType(e.target.value)} />
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
            <Button size="sm" asChild>
              <Link href="/contracts/new"><Plus className="mr-1 h-3.5 w-3.5" /> 신규 등록</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-left">계약자명</th>
              <th className="px-3 py-2 text-left">운영종료일</th>
              <th className="px-3 py-2 text-left">비고</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">임대종료</th>
              <th className="px-3 py-2 text-left">임차인연락처</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Link href={`/contracts/${r.id}`} className="text-primary hover:underline">
                    {r.phase}차
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link href={`/contracts/${r.id}`} className="hover:underline">
                    {r.room_no}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.room_type ?? '-'}</td>
                <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{formatDate(r.operation_end)}</td>
                <td className="px-3 py-2 max-w-[14rem] truncate" title={r.note ?? ''}>
                  {r.note ?? ''}
                </td>
                <td className="px-3 py-2">{r.accommodation_type ?? '-'}</td>
                <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                <td className="px-3 py-2">{formatDate(r.lease_end)}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.tenant_phone ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="조회된 계약이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
