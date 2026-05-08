'use server'

// 객실별 숙박계약서 메타 CRUD 서버 액션.
// 클라이언트는 Storage 업로드 후 publicUrl/path/name/size 를 받아 saveRoomContractAction 호출.

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  insertRoomContractFile,
  deleteRoomContractFile,
} from '@/lib/queries/room-contracts'

export type SaveRoomContractInput = {
  phase: number
  roomNo: string
  fileUrl: string
  filePath: string
  fileName: string
  fileSize: number
  contractDate?: string | null
  guestName?: string | null
  note?: string | null
}

export async function saveRoomContractAction(
  input: SaveRoomContractInput,
): Promise<{ ok: true; id: string } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!input.phase || !input.roomNo || !input.fileUrl || !input.filePath) {
      return { error: '필수 항목 누락' }
    }
    const supabase = createServerSupabase()
    const row = await insertRoomContractFile(supabase, {
      phase: input.phase,
      room_no: input.roomNo,
      file_url: input.fileUrl,
      file_path: input.filePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      contract_date: input.contractDate ?? null,
      guest_name: input.guestName ?? null,
      note: input.note ?? null,
      uploaded_by: user.id,
    })
    revalidatePath('/complaint')
    revalidatePath('/room-transfer')
    return { ok: true, id: row.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteRoomContractAction(
  id: string,
): Promise<{ ok: true; filePath: string | null } | { error: string }> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    if (!id) return { error: 'id 누락' }
    const supabase = createServerSupabase()
    const result = await deleteRoomContractFile(supabase, id)
    revalidatePath('/complaint')
    revalidatePath('/room-transfer')
    return { ok: true, filePath: result?.file_path ?? null }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
