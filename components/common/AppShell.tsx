'use client'

// Sidebar + Header 를 조합한 인증 페이지용 공통 껍데기.
// 모바일 사이드바 open 상태를 관리한다.

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

type Props = {
  userEmail: string | null
  children: React.ReactNode
}

export default function AppShell({ userEmail, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userEmail={userEmail}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  )
}
