'use client'

// 사이드바 네비게이션 (민원접수 / 객실·영선 관리 / 분양관리 / R&R / 공통).
// - 데스크톱: 항상 표시
// - 모바일: open 상태일 때 오버레이로 표시

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RNR_STAFF_NOS, RNR_STAFF_MAPPING } from '@/types/status'

type MenuItem = { label: string; href: string }
type MenuGroup = { title: string; items: MenuItem[] }

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '민원접수',
    items: [{ label: '민원접수', href: '/complaint' }],
  },
  {
    title: '객실·영선 관리',
    items: [
      { label: '접수현황', href: '/maintenance/inbox' },
      { label: '입주지원', href: '/maintenance/move-in' },
      { label: '영선', href: '/maintenance' },
      { label: '객실이동', href: '/room-transfer' },
      { label: '객실체크', href: '/room-check' },
      { label: '객실정비', href: '/room-maintenance' },
    ],
  },
  {
    title: '분양관리',
    items: [
      { label: '계약관리', href: '/contracts' },
      { label: '객실마스터', href: '/room-master' },
      { label: '소유주 관리', href: '/buyers' },
      { label: '분양 요약', href: '/summary/sales' },
      { label: '숙박 요약', href: '/summary/operation' },
      { label: '만료 객실수', href: '/summary/expiry' },
      { label: '객실정보', href: '/room-status' },
    ],
  },
  {
    title: 'R&R',
    items: RNR_STAFF_NOS
      .filter((no) => RNR_STAFF_MAPPING[no].trim() !== '')
      .map((no) => ({ label: RNR_STAFF_MAPPING[no], href: `/rnr/${no}` })),
  },
  {
    title: '공통',
    items: [
      { label: '히스토리', href: '/history/snapshot' },
      { label: '수정이력', href: '/history' },
    ],
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
          'fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-card border-r border-border/60 shadow-sm transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* 로고 */}
        <div className="flex h-13 items-center justify-between border-b border-border/60 px-4 py-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="text-[17px] font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            Bluewin
          </Link>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 메뉴 스크롤 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* 대시보드 — 그룹 밖 단독 */}
          <div className="px-3 mb-1">
            <NavLink href="/dashboard" pathname={pathname} onClick={onClose}>
              대시보드
            </NavLink>
          </div>

          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mt-5 mb-1">
              {/* 그룹 제목 */}
              <div className="px-4 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none">
                  {group.title}
                </span>
              </div>

              {/* 메뉴 아이템 2열 그리드 */}
              <ul className="grid grid-cols-2 gap-1 px-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink href={item.href} pathname={pathname} onClick={onClose}>
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
  const isActive =
    pathname === href ||
    (pathname.startsWith(`${href}/`) &&
      !(href === '/maintenance' && pathname.startsWith('/maintenance/inbox')) &&
      !(href === '/maintenance' && pathname.startsWith('/maintenance/move-in')) &&
      !(href === '/history' && pathname.startsWith('/history/snapshot')))

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex min-h-[36px] w-full items-center rounded-lg px-2.5 py-1.5 text-[13px] font-medium leading-snug transition-all duration-150',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {isActive && (
        <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      )}
      {children}
    </Link>
  )
}
