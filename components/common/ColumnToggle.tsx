'use client'

// 목록 컬럼 펼치기·접기 토글.
// 기본 표시 컬럼 외의 추가 컬럼을 사용자가 드롭다운 체크박스로 선택하게 한다.
// 선택 상태는 localStorage 에 storageKey 로 저장되어 다음 방문 시 복원된다.
//
// 사용 예:
//   const [visible, setVisible] = useColumnToggle('contracts', EXTENDED_COLUMNS.map((c) => c.key))
//   <ColumnToggle storageKey="contracts" columns={EXTENDED_COLUMNS} value={visible} onChange={setVisible} />

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ColumnSpec = {
  key: string
  label: string
}

type Props = {
  storageKey: string
  columns: ColumnSpec[]
  value: string[]
  onChange: (next: string[]) => void
  className?: string
}

// 훅: 초기값을 localStorage 에서 복원. SSR 안전(마운트 후 hydrate).
export function useColumnToggle(
  storageKey: string,
  defaultKeys: string[] = [],
): [string[], (next: string[]) => void] {
  const [value, setValue] = useState<string[]>(defaultKeys)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const raw = localStorage.getItem(`col-toggle:${storageKey}`)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
          setValue(parsed as string[])
        }
      }
    } catch {
      // storage 접근 실패 시 기본값 유지.
    }
  }, [storageKey])

  const save = (next: string[]) => {
    setValue(next)
    try {
      localStorage.setItem(`col-toggle:${storageKey}`, JSON.stringify(next))
    } catch {
      // 저장 실패는 무시.
    }
  }

  return [value, save]
}

export default function ColumnToggle({
  storageKey,
  columns,
  value,
  onChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭으로 닫기.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (key: string) => {
    const set = new Set(value)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChange(Array.from(set))
  }

  const selectAll = () => onChange(columns.map((c) => c.key))
  const clearAll = () => onChange([])

  return (
    <div ref={wrapRef} className={cn('relative', className)} data-storage-key={storageKey}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
        aria-expanded={open}
      >
        컬럼 펼치기
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {value.length}/{columns.length}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-md border bg-popover p-2 shadow-md">
          <div className="mb-1 flex items-center justify-between border-b pb-1 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="px-2 py-1 hover:text-primary"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2 py-1 hover:text-primary"
            >
              전체 해제
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {columns.map((col) => {
              const checked = value.includes(col.key)
              return (
                <li key={col.key}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(col.key)}
                      className="h-4 w-4"
                    />
                    <span>{col.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
