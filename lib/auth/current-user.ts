// 서버 컴포넌트/액션에서 현재 로그인 사용자 + public.users 레코드를 같이 가져오는 헬퍼.
// public.users 와 auth.users 는 id 가 동일하다고 가정 (Phase 2 수동 매핑 또는 Phase 8 트리거).

import { createServerSupabase } from '@/lib/supabase/server'
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

  // public.users 미생성 상태(초기 가입 직후)일 수 있음 — auth user 정보로 폴백.
  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.email?.split('@')[0] ?? '사용자',
      role: 'staff',
      assignedPhase: null,
    }
  }

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

export const isAdmin = (user: AppUser | null): boolean => user?.role === 'admin'
