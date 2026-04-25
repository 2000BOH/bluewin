// 서버 컴포넌트/액션에서 현재 로그인 사용자 + public.users 레코드를 같이 가져오는 헬퍼.
// public.users 에 레코드가 없으면 service role 로 자동 생성하여 FK 위반을 방지한다.

import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import type { Database, UserRole } from '@/types/supabase'

export type AppUser = {
  id: string
  email: string
  name: string
  role: UserRole
  assignedPhase: number | null
}

export const getCurrentAppUser = async (): Promise<AppUser | null> => {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, role, assigned_phase')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    type Row = Database['public']['Tables']['users']['Row']
    const p = profile as Pick<Row, 'id' | 'email' | 'name' | 'role' | 'assigned_phase'>
    return {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      assignedPhase: p.assigned_phase,
    }
  }

  // public.users 에 레코드가 없는 경우: service role 로 자동 upsert
  // (users 테이블은 RLS 상 service_role 만 insert 가능)
  const name = user.user_metadata?.name ?? user.email?.split('@')[0] ?? '사용자'
  try {
    const serviceSupabase = createServiceSupabase()
    await serviceSupabase.from('users').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        name,
        role: 'staff' satisfies UserRole,
        assigned_phase: null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  } catch (e) {
    console.error('[getCurrentAppUser] public.users 자동 생성 실패:', e)
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name,
    role: 'staff',
    assignedPhase: null,
  }
}

export const isAdmin = (user: AppUser | null): boolean => user?.role === 'admin'
