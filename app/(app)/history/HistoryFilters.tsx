'use client'

// 수정이력 필터 바.
// 조회 버튼을 눌러야 결과가 표시되도록 ?search=1 토큰을 함께 전달한다.

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import { RefreshCw, Search } from 'lucide-react'
import { useRoomInput } from '@/hooks/useRoomInput'

// 사이드바 메뉴와 동일한 레이블로 노출 (실제 DB 테이블은 일부 통합).
const TABLE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '접수현황·영선', value: 'maintenance_requests' },
  { label: '객실이동', value: 'room_transfers' },
  { label: '객실체크', value: 'room_checks' },
  { label: '객실정비', value: 'room_maintenance_tasks' },
  { label: '객실마스터·객실정보', value: 'rooms' },
  { label: '소유주 관리', value: 'buyers' },
  { label: '계약관리', value: 'contracts' },
]

export default function HistoryFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [tableName, setTableName] = useState(params.get('table_name') ?? '')
  const [action, setAction]       = useState(params.get('action') ?? '')
  const [from, setFrom]           = useState(params.get('from') ?? '')
  const [to, setTo]               = useState(params.get('to') ?? '')
  const [q, setQ]                 = useState(params.get('q') ?? '')
  const applyFetch = (p: string, r: string) => {
    const sp = new URLSearchParams()
    sp.set('search', '1')
    if (tableName) sp.set('table_name', tableName)
    if (action) sp.set('action', action)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (p) sp.set('phase', p)
    if (r) sp.set('room_no', r)
    if (q) sp.set('q', q)
    startTransition(() => router.push(`/history?${sp.toString()}`))
  }

  const {
    phase,
    roomNo,
    roomNoRef,
    handlePhaseChange,
    handleRoomNoChange,
    handleRoomCompositionStart,
    handleRoomCompositionEnd,
  } = useRoomInput({
    initialPhase: params.get('phase') ?? '',
    initialRoomNo: params.get('room_no') ?? '',
    onAutoFetch: applyFetch,
  })

  const apply = () => applyFetch(phase, roomNo)

  const reset = () => {
    setTableName(''); setAction(''); setFrom(''); setTo('')
    setQ('')
    applyFetch('', '')
    startTransition(() => router.push('/history'))
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="테이블">
          <Select value={tableName} onChange={(e) => setTableName(e.target.value)}>
            <option value="">전체</option>
            {TABLE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
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
        <Field label="차수">
          <TextInput
            type="number"
            min={1}
            value={phase}
            placeholder="전체"
            onChange={handlePhaseChange}
          />
        </Field>
        <Field label="호수">
          <TextInput
            ref={roomNoRef}
            value={roomNo}
            placeholder="전체"
            onChange={handleRoomNoChange}
            onCompositionStart={handleRoomCompositionStart}
            onCompositionEnd={handleRoomCompositionEnd}
          />
        </Field>
        <Field label="시작">
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="종료">
          <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="검색어" className="sm:col-span-3 lg:col-span-2">
          <TextInput
            value={q}
            placeholder="필드명·값(이전/이후) 통합 검색"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') apply()
            }}
          />
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
