// Supabase Storage 업로드 — 객실체크 사진 전용.
// 버킷: 'room-check-photos' (public, 접근 정책은 Supabase 대시보드에서 설정)
// 경로: <phase>/<room_no>/<timestamp>_<rand>.jpg

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'room-check-photos'

const randSuffix = () => Math.random().toString(36).slice(2, 8)

export const uploadRoomCheckPhoto = async (
  blob: Blob,
  meta: { phase: number | string; roomNo: string },
): Promise<string> => {
  const supabase = createClient()
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${meta.phase}/${meta.roomNo}/${Date.now()}_${randSuffix()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// URL 에서 storage path 추출 후 삭제.
// 공개 URL 포맷: https://.../storage/v1/object/public/<bucket>/<path>
export const deleteRoomCheckPhoto = async (publicUrl: string): Promise<void> => {
  const supabase = createClient()
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`사진 삭제 실패: ${error.message}`)
}
