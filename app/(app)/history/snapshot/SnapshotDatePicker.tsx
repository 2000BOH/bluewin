'use client'

// 히스토리 보기 — 날짜 선택 컨트롤.
// URL ?asOf=YYYY-MM-DD 로 전달. 기본값은 어제.

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isPreTriggerDate, TRIGGER_INSTALLED_AT } from '@/lib/queries/snapshot'

const formatDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

const todayStr = (): string => formatDate(new Date())

const lastWeekStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return formatDate(d)
}

const lastMonthStr = (): string => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return formatDate(d)
}

const QUICK_PRESETS: Array<{ label: string; getValue: () => string }> = [
  { label: '오늘', getValue: todayStr },
  { label: '어제', getValue: yesterdayStr },
  { label: '지난주', getValue: lastWeekStr },
  { label: '지난달', getValue: lastMonthStr },
]

type Props = {
  currentAsOf: string
}

export default function SnapshotDatePicker({ currentAsOf }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [draft, setDraft] = useState(currentAsOf)

  useEffect(() => setDraft(currentAsOf), [currentAsOf])

  const apply = (date: string) => {
    if (!date) return
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('asOf', date)
    router.push(`${pathname}?${params.toString()}`)
  }

  const isPreTrigger = isPreTriggerDate(currentAsOf)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">📅 기준일</span>
          <input
            type="date"
            value={draft}
            max={todayStr()}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => apply(draft)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            적용
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const v = p.getValue()
                setDraft(v)
                apply(v)
              }}
              className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            기준 시각: <span className="font-mono font-semibold text-foreground">{currentAsOf} 23:59:59 KST</span>
          </span>
        </div>
      </div>

      {isPreTrigger && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <span>⚠️</span>
          <span>
            수정이력 트리거 도입일({TRIGGER_INSTALLED_AT}) 이전 날짜입니다. 일부 행은 현재 데이터로
            폴백되어 표시되며 ⚠️ 표시가 붙습니다.
          </span>
        </div>
      )}
    </div>
  )
}
