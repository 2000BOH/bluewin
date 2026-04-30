'use client'

// 행 단위 "우선/완료" 표시 상태 관리 훅.
// localStorage 에 페이지(scope)별로 ID 목록을 저장한다.
// 우선과 완료는 서로 독립 — 한 행에 동시에 적용 가능.
//
// 추후 "완료" 시 데이터 이동 흐름이 정의되면 toggleDone 안에서
// 서버 액션을 호출하도록 확장한다.

import { useCallback, useEffect, useState } from 'react'

export type RowFlags = { priority: boolean; done: boolean }

type FlagState = {
  priority: string[]
  done: string[]
}

const STORAGE_PREFIX = 'bluewin:rowflags:'
const EMPTY_STATE: FlagState = { priority: [], done: [] }

export function useRowFlags(scope: string) {
  const storageKey = `${STORAGE_PREFIX}${scope}`
  const [state, setState] = useState<FlagState>(EMPTY_STATE)
  const [hydrated, setHydrated] = useState(false)
  // 정렬용 우선 스냅샷. 마운트(또는 페이지 재진입) 시점에만 갱신되고,
  // 이후 클릭으로 바뀌는 state.priority 와는 별개로 고정된다.
  // → 누른 즉시는 자리 유지, 다른 페이지로 갔다 오거나 새로고침하면 최상단으로 이동.
  const [prioritySnapshot, setPrioritySnapshot] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    let initialPriority: string[] = []
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FlagState>
        initialPriority = Array.isArray(parsed.priority) ? parsed.priority : []
        setState({
          priority: initialPriority,
          done: Array.isArray(parsed.done) ? parsed.done : [],
        })
      }
    } catch {
      // 손상된 값이면 무시
    }
    setPrioritySnapshot(new Set(initialPriority))
    setHydrated(true)
  }, [storageKey])

  const persist = useCallback(
    (next: FlagState) => {
      setState(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // 저장 실패는 무시(쿼터 초과 등)
      }
    },
    [storageKey],
  )

  const togglePriority = useCallback(
    (id: string) => {
      const inP = state.priority.includes(id)
      persist({
        priority: inP
          ? state.priority.filter((x) => x !== id)
          : [...state.priority, id],
        done: state.done,
      })
    },
    [state, persist],
  )

  const toggleDone = useCallback(
    (id: string) => {
      const inD = state.done.includes(id)
      persist({
        priority: state.priority,
        done: inD ? state.done.filter((x) => x !== id) : [...state.done, id],
      })
    },
    [state, persist],
  )

  const flagsOf = useCallback(
    (id: string): RowFlags => ({
      priority: state.priority.includes(id),
      done: state.done.includes(id),
    }),
    [state],
  )

  return {
    state,
    hydrated,
    togglePriority,
    toggleDone,
    flagsOf,
    prioritySnapshot,
  }
}

// 마운트 시점에 캡처된 우선 스냅샷 기준으로 정렬.
// 우선(0) → 그 외(1). 같은 그룹 내 순서는 유지(stable sort).
// 완료는 원래 자리에 그대로 둔다.
export function sortByFlag<T extends { id: string }>(
  rows: T[],
  prioritySnapshot: Set<string>,
): T[] {
  const weight = (id: string) => (prioritySnapshot.has(id) ? 0 : 1)
  return rows
    .map((row, idx) => ({ row, idx }))
    .sort((a, b) => {
      const diff = weight(a.row.id) - weight(b.row.id)
      return diff !== 0 ? diff : a.idx - b.idx
    })
    .map((entry) => entry.row)
}

// <tr> 에 적용할 클래스. 우선=강조, 완료=음영. 둘 다일 때 음영 우선(가독성).
export function rowFlagClass(flags: RowFlags): string {
  if (flags.done) {
    return 'bg-muted/60 text-muted-foreground opacity-40 hover:bg-muted/70'
  }
  if (flags.priority) {
    return 'bg-amber-50 ring-1 ring-inset ring-amber-300/70 hover:bg-amber-100/80'
  }
  return 'hover:bg-muted/20'
}
