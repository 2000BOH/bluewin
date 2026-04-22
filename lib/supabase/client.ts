// 브라우저(Client Component)용 Supabase 클라이언트.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './info'

export const createClient = () =>
  createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey())
