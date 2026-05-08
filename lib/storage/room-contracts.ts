// Supabase Storage 업로드 — 객실별 숙박계약서 PDF 전용.
// 버킷: 'room-contracts' (private 권장; 다운로드는 signed URL 또는 public URL).
// 경로: <phase>/<room_no>/<timestamp>_<rand>_<safeName>.pdf

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'room-contracts'

const randSuffix = () => Math.random().toString(36).slice(2, 8)

// 한글/공백 등 안전한 파일명으로 정리.
const sanitize = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80)

export type RoomContractUploadResult = {
  publicUrl: string
  path: string
  size: number
  name: string
}

export const uploadRoomContract = async (
  file: File,
  meta: { phase: number | string; roomNo: string },
): Promise<RoomContractUploadResult> => {
  const supabase = createClient()
  const safeName = sanitize(file.name)
  const path = `${meta.phase}/${meta.roomNo}/${Date.now()}_${randSuffix()}_${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
  if (error) throw new Error(`계약서 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    publicUrl: data.publicUrl,
    path,
    size: file.size,
    name: file.name,
  }
}

export const deleteRoomContract = async (path: string): Promise<void> => {
  if (!path) return
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`계약서 삭제 실패: ${error.message}`)
}
