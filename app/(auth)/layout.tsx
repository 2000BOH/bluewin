// 로그인/회원가입 등 비인증 페이지 공통 레이아웃.
// 사이드바 없이 중앙 정렬만 제공.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      {children}
    </div>
  )
}
