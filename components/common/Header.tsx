'use client'

// 상단 헤더: 모바일 햄버거, 로고, 사용자 이메일, 로그아웃 버튼.

import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  userEmail: string | null
  onToggleSidebar: () => void
}

export default function Header({ userEmail, onToggleSidebar }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={onToggleSidebar}
          className="rounded-md p-2 hover:bg-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold lg:hidden">Bluewin</span>
      </div>

      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
        )}
        <form action="/api/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            aria-label="로그아웃"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
