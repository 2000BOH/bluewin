// 페이지 상단 공통 헤더. 제목 + 설명 + 우측 액션 영역.

import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
