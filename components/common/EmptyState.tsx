// 목록이 비어있을 때 표시하는 안내 박스.

import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type Props = {
  title?: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({
  title = '데이터가 없습니다',
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
