// 객실·영선 관리 전반 공통 상태 배지.
// STATUS_STYLE 에 등록된 상태값을 일관된 색상으로 표시한다.
// DB enum / COMMON_STATUSES / STATUS_STYLE 셋 중 하나만 어긋나도 크래시를 막기 위해
// 매칭되는 스타일이 없으면 회색 fallback 으로 안전하게 렌더링한다.
//
// 사용 예:
//   <StatusBadge status="영선" />
//   <StatusBadge status="완료" size="sm" />

import { cn } from '@/lib/utils'
import { STATUS_STYLE } from '@/lib/utils/status'
import type { CommonStatus } from '@/types/status'

type Props = {
  status: CommonStatus | string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_STYLE: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
}

const FALLBACK_STYLE = {
  className:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800',
  label: '미정',
  description: '미등록 상태값',
}

const StatusBadge = ({ status, size = 'md', className }: Props) => {
  const style =
    status && (STATUS_STYLE as Record<string, typeof FALLBACK_STYLE>)[status]
      ? (STATUS_STYLE as Record<string, typeof FALLBACK_STYLE>)[status]
      : { ...FALLBACK_STYLE, label: status ? String(status) : FALLBACK_STYLE.label }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-medium leading-none whitespace-nowrap',
        style.className,
        SIZE_STYLE[size],
        className,
      )}
      title={style.description}
      aria-label={`상태: ${style.label}`}
    >
      {style.label}
    </span>
  )
}

export default StatusBadge
