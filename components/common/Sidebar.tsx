'use client'

// 사이드바 네비게이션 (민원접수 / 객실·영선 관리 / 분양관리 / R&R / 공통).
// - 데스크톱: 항상 표시
// - 모바일: open 상태일 때 오버레이로 표시

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type MenuItem = { label: string; href: string }
type MenuGroup = { title: string; items: MenuItem[] }

// CLAUDE.md 사이드바 메뉴 구성 (PDF 페이지 구성 기준 재편)
// - 상담관리/상담내역 제거
// - 민원접수 / 접수현황 / R&R 신설
// - "영선 관리" → "영선" 명칭 변경
const MENU_GROUPS: MenuGroup[] = [
  {
    title: '민원접수',
    items: [{ label: '민원접수', href: '/complaint' }],
  },
  {
    title: '객실·영선 관리',
    items: [
      { label: '접수현황', href: '/maintenance/inbox' },
      { label: '영선', href: '/maintenance' },
      { label: '객실이동', href: '/room-transfer' },
      { label: '객실체크', href: '/room-check' },
      { label: '객실정비', href: '/room-maintenance' },
    ],
  },
  {
    title: '분양관리',
    items: [
      { label: '객실마스터', href: '/room-master' },
      { label: '수분양자마스터', href: '/buyers' },
      { label: '계약관리', href: '/contracts' },
      { label: '분양관리 Summary', href: '/summary/sales' },
      { label: '운영숙박 Summary', href: '/summary/operation' },
      { label: '계약기간 만료 객실수', href: '/summary/expiry' },
      { label: '객실현황 데이터', href: '/room-status' },
    ],
  },
  {
    // R&R: 배정된 담당자만 노출. 번호(04/06)는 숨김 (DB 레코드는 유지).
    // 이름·직책은 rnr_mapping 의 name 과 1:1 동기화 (migration 005).
    title: 'R&R',
    items: [
      { label: '유태형 과장', href: '/rnr/01' },
      { label: '허아름 대리', href: '/rnr/02' },
      { label: '김동훈 대리', href: '/rnr/03' },
      { label: '강민수 사원', href: '/rnr/05' },
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
          {/* 대시보드는 고정 고급 항목 — 그룹 밖에 단독 노출. */}
          <ul className="space-y-0.5 px-2">
            <li>
              <NavLink href="/dashboard" pathname={pathname} onClick={onClose}>
                대시보드
              </NavLink>
            </li>
          </ul>

          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mt-5">
              {/* 그룹 제목: 비선택 헤더.
                  - cursor-default + select-none 으로 '클릭 불가' 시각 신호.
                  - 좌측 액센트 바 + 우측 구분선으로 항목(NavLink)과 명확히 분리.
                  - aria-hidden=false + role=heading level=3 로 시맨틱 유지. */}
              <div
                className="mb-1.5 flex select-none items-center gap-2 px-4 pt-1 cursor-default"
                role="heading"
                aria-level={3}
              >
                <span className="h-3 w-1 rounded-full bg-primary/60" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>
              <ul className="space-y-0.5 px-2">
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
        // 좌측 여백(ml-3)으로 그룹 제목보다 한 단계 들여써서 계층 구조를 시각화.
        'ml-3 flex items-center rounded-md px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-foreground/90 hover:bg-muted',
      )}
    >
      {children}
    </Link>
  )
}
