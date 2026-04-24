// 객실·영선 관리 전반 공통 상태 배지.
// 6가지 상태(접수/영선/외부업체/퇴실/청소/완료)를 일관된 색상으로 표시한다.
//
// 사용 예:
//   <StatusBadge status="영선" />
//   <StatusBadge status="완료" size="sm" />

import { cn } from '@/lib/utils'
import { STATUS_STYLE } from '@/lib/utils/status'
import type { CommonStatus } from '@/types/status'

type Props = {
  status: CommonStatus
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_STYLE: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
}

const StatusBadge = ({ status, size = 'md', className }: Props) => {
  const style = STATUS_STYLE[status]

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
