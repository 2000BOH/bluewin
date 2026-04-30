'use client'

// 행 No 옆에 들어가는 [우선] / [완료] 토글 버튼 셀.
// 사용처: 접수현황 · 영선 · 객실이동 · 객실체크 · 객실정비.
// 우선 — 행을 강조 + 최상단 정렬, 완료 — 음영 처리. 두 상태는 독립.

import { Check, Star } from 'lucide-react'

type Props = {
  priority: boolean
  done: boolean
  onPriority: () => void
  onDone: () => void
}

export default function RowActionCell({
  priority,
  done,
  onPriority,
  onDone,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {/* 우선: 별표 아이콘 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPriority()
        }}
        className={`inline-flex h-6 w-6 items-center justify-center rounded transition ${
          priority
            ? 'bg-amber-100 text-amber-600'
            : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-600'
        }`}
        title="우선 처리 표시 (최상단 이동)"
        aria-pressed={priority}
        aria-label="우선"
      >
        <Star
          className={`h-3.5 w-3.5 ${priority ? 'fill-amber-400 text-amber-500' : ''}`}
        />
      </button>

      {/* 완료: 체크박스 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
        className="inline-flex items-center"
        title="완료 표시"
        aria-pressed={done}
        aria-label="완료"
      >
        <span
          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
            done
              ? 'border-gray-500 bg-gray-500 text-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </span>
      </button>
    </div>
  )
}
