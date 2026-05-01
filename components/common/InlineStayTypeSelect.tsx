'use client'

// 숙박형태 배지를 클릭하면 그 자리에서 select 로 전환되어 즉시 변경한다.
// InlineStatusSelect 와 동일한 패턴. router.refresh() 는 내부에서 처리.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import StayTypeBadge from './StayTypeBadge'
import { STAY_TYPES } from '@/types/status'
import type { StayType } from '@/types/status'

type Props = {
  stayType: string | null
  onChange: (next: StayType | null) => Promise<{ ok: true } | { error: string }>
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function InlineStayTypeSelect({
  stayType,
  onChange,
  size = 'md',
  disabled = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(t)
  }, [error])

  const apply = (val: string) => {
    const next = (val || null) as StayType | null
    if (next === stayType) { setEditing(false); return }
    startTransition(async () => {
      const res = await onChange(next)
      if ('error' in res) { setError(res.error); setEditing(false); return }
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (disabled || pending) return; setEditing(true) }}
          disabled={disabled || pending}
          className="inline-flex cursor-pointer rounded-full transition hover:opacity-80 disabled:cursor-default disabled:opacity-50"
          title="클릭하여 숙박형태 변경"
          aria-label={`숙박형태 변경: 현재 ${stayType ?? '미지정'}`}
        >
          <StayTypeBadge stayType={stayType} size={size} />
        </button>
        {error && <span className="text-[10px] text-destructive" role="alert">{error}</span>}
      </span>
    )
  }

  return (
    <select
      autoFocus
      value={stayType ?? ''}
      disabled={pending}
      onChange={(e) => apply(e.target.value)}
      onBlur={() => setEditing(false)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
      className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
    >
      <option value="">미지정</option>
      {STAY_TYPES.map((s) => (
        <option key={s} value={s}>{s.replace('_', ' ')}</option>
      ))}
    </select>
  )
}
