'use client'

// 상태 배지를 클릭하면 그 자리에서 select 로 전환되어 상태를 즉시 변경한다.
// 사용처: 접수현황 · 영선 · 객실이동 · 객실체크 · 객실정비 의 "상태/처리상태" 컬럼.
//
// onChange 는 서버 액션을 호출하는 콜백으로, 결과를 { ok: true } | { error } 로 반환해야 한다.
// 변경 성공 시 자동으로 router.refresh() 를 호출해 목록을 갱신한다.

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from './StatusBadge'
import { COMMON_STATUSES } from '@/types/status'
import type { CommonStatus } from '@/types/status'

type Props = {
  status: CommonStatus
  onChange: (next: CommonStatus) => Promise<{ ok: true } | { error: string }>
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function InlineStatusSelect({
  status,
  onChange,
  size = 'md',
  disabled = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(t)
  }, [error])

  const apply = (next: CommonStatus) => {
    if (next === status) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const res = await onChange(next)
      if ('error' in res) {
        setError(res.error)
        setEditing(false)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (disabled || pending) return
            setEditing(true)
          }}
          disabled={disabled || pending}
          className="inline-flex cursor-pointer rounded-full transition hover:opacity-80 disabled:cursor-default disabled:opacity-50"
          title="클릭하여 상태 변경"
          aria-label={`상태 변경: 현재 ${status}`}
        >
          <StatusBadge status={status} size={size} />
        </button>
        {error && (
          <span className="text-[10px] text-destructive" role="alert">
            {error}
          </span>
        )}
      </span>
    )
  }

  return (
    <select
      ref={selectRef}
      autoFocus
      value={status}
      disabled={pending}
      onChange={(e) => apply(e.target.value as CommonStatus)}
      onBlur={() => setEditing(false)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setEditing(false)
      }}
      className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
    >
      {COMMON_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}
