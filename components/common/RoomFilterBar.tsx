'use client'

// 객실·영선 관리 하위 페이지 공통 필터바 (1행)
// 완료구분 · 접수자 · 처리상태 · 날짜범위 · 조회하기/전체/어제/오늘/내일

import { COMMON_STATUSES, ACCEPTORS } from '@/types/status'

export type FilterOption = { value: string; label: string }

const DEFAULT_RECEIVER_OPTIONS: FilterOption[] = ACCEPTORS.map((a) => ({
  value: a,
  label: a,
}))

type Props = {
  // 완료구분
  done: string
  onDoneChange: (v: string) => void

  // 접수자 (생략 시 숨김)
  receiverLabel?: string
  receiverOptions?: FilterOption[]   // 미전달 시 ACCEPTORS 기본값 사용
  receiver?: string
  onReceiverChange?: (v: string) => void

  // 처리상태
  status: string
  onStatusChange: (v: string) => void

  // 날짜 범위
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void

  // 조회 / 초기화
  onSearch: () => void
  onReset: () => void
}

const offsetDay = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const sel =
  'h-9 rounded-md border border-input bg-background px-2 text-sm focus:ring-1 focus:ring-primary'
const dateI =
  'h-9 rounded-md border border-input bg-background px-2 text-sm focus:ring-1 focus:ring-primary'
const btnPrimary =
  'h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap'
const btnOutline =
  'h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap'

export default function RoomFilterBar({
  done,
  onDoneChange,
  receiverLabel = '접수자',
  receiverOptions,
  receiver = '',
  onReceiverChange,
  status,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onSearch,
  onReset,
}: Props) {
  const today     = offsetDay(0)
  const yesterday = offsetDay(-1)
  const tomorrow  = offsetDay(1)

  const setYesterday = () => { onDateFromChange(yesterday); onDateToChange(yesterday) }
  const setToday     = () => { onDateFromChange(today);     onDateToChange(today) }
  const setTomorrow  = () => { onDateFromChange(tomorrow);  onDateToChange(tomorrow) }

  const options = receiverOptions ?? DEFAULT_RECEIVER_OPTIONS

  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm overflow-x-auto">
      <div className="flex items-end gap-2 min-w-fit">

        {/* 완료구분 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">완료구분</label>
          <select value={done} onChange={(e) => onDoneChange(e.target.value)} className={`${sel} w-24`}>
            <option value="">전체</option>
            <option value="undone">미완료</option>
            <option value="done">완료</option>
          </select>
        </div>

        {/* 접수자 */}
        {onReceiverChange && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{receiverLabel}</label>
            <select value={receiver} onChange={(e) => onReceiverChange(e.target.value)} className={`${sel} w-28`}>
              <option value="">전체</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* 처리상태 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">처리상태</label>
          <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={`${sel} w-28`}>
            <option value="">전체</option>
            {COMMON_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 날짜 범위 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">날짜 범위</label>
          <div className="flex items-center gap-1">
            <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className={dateI} />
            <span className="text-muted-foreground text-sm">~</span>
            <input type="date" value={dateTo}   onChange={(e) => onDateToChange(e.target.value)}   className={dateI} />
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-transparent select-none">버튼</label>
          <div className="flex gap-1.5">
            <button type="button" onClick={onSearch}      className={btnPrimary}>조회하기</button>
            <button type="button" onClick={onReset}       className={btnOutline}>전체</button>
            <button type="button" onClick={setYesterday}  className={btnOutline}>어제</button>
            <button type="button" onClick={setToday}      className={btnOutline}>오늘</button>
            <button type="button" onClick={setTomorrow}   className={btnOutline}>내일</button>
          </div>
        </div>

      </div>
    </div>
  )
}
