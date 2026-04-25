// Service Role 클라이언트 — RLS 우회 가능, 서버 전용.
// SUPABASE_SERVICE_ROLE_KEY 는 절대 클라이언트에 노출하면 안 됨.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabaseUrl } from './info'

const getServiceRoleKey = (): string => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.')
  return key
}

export const createServiceSupabase = () =>
  createClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false },
  })
