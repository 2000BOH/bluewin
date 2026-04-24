// 숙박형태 배지 컴포넌트.
// 계약관리, 민원접수, 접수현황, Summary 등 전역에서 숙박형태 표시 시 사용한다.
// 숙박형태 값: 인스파이어 / 장박_법인 / 장박_개인 / 호텔 / 기숙사 / 퇴실 / 보수중 / 공실 / 입실예정 / 계약만료 / 사용금지

import { cn } from '@/lib/utils'
import { STAY_TYPES, type StayType } from '@/types/status'

type Props = {
  stayType: StayType | string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

const STAY_TYPE_STYLE: Record<StayType, { className: string; description: string }> = {
  인스파이어: {
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
    description: '인스파이어 운영',
  },
  장박_법인: {
    className: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    description: '장박 (법인)',
  },
  장박_개인: {
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    description: '장박 (개인)',
  },
  호텔: {
    className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    description: '호텔 운영',
  },
  기숙사: {
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    description: '기숙사 운영',
  },
  퇴실: {
    className: 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    description: '퇴실 상태',
  },
  보수중: {
    className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    description: '보수 중',
  },
  공실: {
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800',
    description: '공실',
  },
  입실예정: {
    className: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    description: '입실 예정',
  },
  계약만료: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900',
    description: '계약 만료',
  },
  사용금지: {
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    description: '사용 금지',
  },
}

const SIZE_STYLE: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
}

const isKnownStayType = (value: string): value is StayType =>
  (STAY_TYPES as readonly string[]).includes(value)

const StayTypeBadge = ({ stayType, size = 'md', className }: Props) => {
  if (!stayType) return <span className="text-xs text-muted-foreground">-</span>
  if (!isKnownStayType(stayType)) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border bg-muted text-muted-foreground font-medium leading-none whitespace-nowrap',
          SIZE_STYLE[size],
          className,
        )}
        title={`알 수 없는 숙박형태: ${stayType}`}
      >
        {stayType}
      </span>
    )
  }

  const style = STAY_TYPE_STYLE[stayType]
  const label = stayType.replace('_', ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-medium leading-none whitespace-nowrap',
        style.className,
        SIZE_STYLE[size],
        className,
      )}
      title={style.description}
      aria-label={`숙박형태: ${label}`}
    >
      {label}
    </span>
  )
}

export default StayTypeBadge
