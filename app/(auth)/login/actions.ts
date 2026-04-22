'use server'

// 로그인 / 로그아웃 서버 액션.
// Supabase Auth 의 이메일+비밀번호 로그인을 수행하고, 성공 시 redirect 파라미터나 /dashboard 로 이동한다.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export type LoginState = {
  error?: string
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirect') ?? '/dashboard')

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력하세요.' }
  }

  try {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
  } catch {
    return { error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
}
