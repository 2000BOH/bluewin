'use client'

// 사이드바 네비게이션 (3그룹: 분양관리 / 객실·영선 관리 / 공통).
// - 데스크톱: 항상 표시
// - 모바일: open 상태일 때 오버레이로 표시

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type MenuItem = { label: string; href: string }
type MenuGroup = { title: string; items: MenuItem[] }

// CLAUDE.md 사이드바 메뉴 구성
const MENU_GROUPS: MenuGroup[] = [
  {
    title: '분양관리',
    items: [
      { label: '객실마스터', href: '/room-master' },
      { label: '수분양자마스터', href: '/buyers' },
      { label: '계약관리', href: '/contracts' },
      { label: '상담관리', href: '/consultations' },
      { label: '상담내역', href: '/consultation-history' },
      { label: '분양관리 Summary', href: '/summary/sales' },
      { label: '운영숙박 Summary', href: '/summary/operation' },
      { label: '계약기간 만료 객실수', href: '/summary/expiry' },
      { label: '객실현황 데이터', href: '/room-status' },
    ],
  },
  {
    title: '객실·영선 관리',
    items: [
      { label: '영선 관리', href: '/maintenance' },
      { label: '객실이동', href: '/room-transfer' },
      { label: '객실체크', href: '/room-check' },
      { label: '객실정비', href: '/room-maintenance' },
    ],
  },
  {
    title: '공통',
    items: [{ label: '수정이력', href: '/history' }],
  },
]

type Props = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* 로고 */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="text-lg font-bold" onClick={onClose}>
            Bluewin
          </Link>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 메뉴 스크롤 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            <li>
              <NavLink href="/dashboard" pathname={pathname} onClick={onClose}>
                대시보드
              </NavLink>
            </li>
          </ul>

          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mt-6">
              <h2 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h2>
              <ul className="mt-2 space-y-1 px-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      pathname={pathname}
                      onClick={onClose}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

function NavLink({
  href,
  pathname,
  children,
  onClick,
}: {
  href: string
  pathname: string
  children: React.ReactNode
  onClick: () => void
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-muted',
      )}
    >
      {children}
    </Link>
  )
}
