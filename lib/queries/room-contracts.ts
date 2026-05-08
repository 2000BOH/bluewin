// 객실별 숙박계약서 파일 메타 CRUD.
// 파일 자체는 lib/storage/room-contracts.ts 에서 다룸.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Sb = SupabaseClient<Database>

export type RoomContractFileRow =
  Database['public']['Tables']['room_contract_files']['Row']
export type RoomContractFileInsert =
  Database['public']['Tables']['room_contract_files']['Insert']

// 객실 단위로 등록 시간 내림차순 — 0번이 "현재(최신)" 계약서.
export const listRoomContractFiles = async (
  supabase: Sb,
  phase: number,
  roomNo: string,
): Promise<RoomContractFileRow[]> => {
  const { data, error } = await supabase
    .from('room_contract_files')
    .select('*')
    .eq('phase', phase)
    .eq('room_no', roomNo)
    .order('uploaded_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []) as RoomContractFileRow[]
}

export const insertRoomContractFile = async (
  supabase: Sb,
  payload: RoomContractFileInsert,
): Promise<RoomContractFileRow> => {
  const { data, error } = await supabase
    .from('room_contract_files')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as RoomContractFileRow
}

export const deleteRoomContractFile = async (
  supabase: Sb,
  id: string,
): Promise<{ file_path: string } | null> => {
  // path 를 먼저 가져와 호출자에게 반환 (Storage 에서도 삭제하도록).
  const { data: row, error: selErr } = await supabase
    .from('room_contract_files')
    .select('file_path')
    .eq('id', id)
    .single()
  if (selErr || !row) return null

  const { error: delErr } = await supabase
    .from('room_contract_files')
    .delete()
    .eq('id', id)
  if (delErr) throw new Error(delErr.message)

  return { file_path: row.file_path }
}
