// 인증된 사용자용 공통 레이아웃 (사이드바 + 헤더).
// middleware 에서 이미 인증 가드를 거치므로 여기서는 사용자 정보 조회만 수행.

import { createServerSupabase } from '@/lib/supabase/server'
import AppShell from '@/components/common/AppShell'

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <AppShell userEmail={user?.email ?? null}>{children}</AppShell>
}
