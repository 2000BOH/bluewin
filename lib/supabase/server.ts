// 서버 컴포넌트 / 라우트 핸들러 / 서버 액션에서 사용하는 Supabase 클라이언트.

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './info'

export const createServerSupabase = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // 서버 컴포넌트에서는 cookies 가 readonly 이므로 무시.
          // 세션 갱신은 middleware 에서 수행된다.
        }
      },
    },
  })
}
