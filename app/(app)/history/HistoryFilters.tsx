'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import { RefreshCw, Search } from 'lucide-react'

export default function HistoryFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [tableName, setTableName] = useState(params.get('table_name') ?? '')
  const [action, setAction] = useState(params.get('action') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')

  const apply = () => {
    const sp = new URLSearchParams()
    if (tableName) sp.set('table_name', tableName)
    if (action) sp.set('action', action)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (q) sp.set('q', q)
    startTransition(() => router.push(`/history?${sp.toString()}`))
  }
  const reset = () => {
    setTableName(''); setAction(''); setFrom(''); setTo(''); setQ('')
    startTransition(() => router.push('/history'))
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="테이블">
          <Select value={tableName} onChange={(e) => setTableName(e.target.value)}>
            <option value="">전체</option>
            <option value="rooms">객실마스터</option>
            <option value="buyers">수분양자</option>
            <option value="contracts">계약</option>
            <option value="maintenance_requests">영선요청</option>
            <option value="room_transfers">객실이동</option>
            <option value="room_checks">객실체크</option>
            <option value="room_maintenance_tasks">객실정비</option>
          </Select>
        </Field>
        <Field label="동작">
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">전체</option>
            <option value="insert">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
          </Select>
        </Field>
        <Field label="시작">
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="종료">
          <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="필드명">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="컬럼명 검색" />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화
        </Button>
        <Button size="sm" onClick={apply}>
          <Search className="mr-1 h-3.5 w-3.5" /> 조회
        </Button>
      </div>
    </div>
  )
}
