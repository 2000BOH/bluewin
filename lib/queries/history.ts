// change_history 조회 쿼리.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>
export type HistoryRow = Database['public']['Tables']['change_history']['Row']

export type HistoryFilter = {
  tableName?: string | null
  action?: 'insert' | 'update' | 'delete' | null
  from?: string | null
  to?: string | null
  q?: string | null
}

export const listHistory = async (
  supabase: Sb,
  filter: HistoryFilter = {},
  limit = 500,
): Promise<HistoryRow[]> => {
  let query = supabase
    .from('change_history')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (filter.tableName) query = query.eq('table_name', filter.tableName)
  if (filter.action) query = query.eq('action', filter.action)
  if (filter.from) query = query.gte('changed_at', filter.from)
  if (filter.to) query = query.lte('changed_at', filter.to)
  if (filter.q) query = query.ilike('field_name_ko', `%${filter.q}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as HistoryRow[]
}
