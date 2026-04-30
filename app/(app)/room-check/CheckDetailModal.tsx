'use client'

// 객실체크 상세 모달. CheckTable 의 [상세] 버튼에서 호출.
// - 저장된 checklist_detail / 3종 특이사항 → 컴포넌트로 복원
// - 저장 시 saveCheckDetailAction 호출
// - 사진은 Supabase Storage 업로드 후 URL 만 보관 (uploadRoomCheckPhoto 사용)

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/common/Modal'
import {
  RoomChecklistDetail,
  type CheckNotes,
  type ChecklistSaveResult,
} from '@/components/features/room/RoomChecklistDetail'
import { compressImage } from '@/lib/utils/image-compress'
import { uploadRoomCheckPhoto } from '@/lib/storage/room-check-photos'
import { saveCheckDetailAction } from './actions'
import type { CheckRow } from '@/lib/queries/room-check'

type Props = {
  open: boolean
  onClose: () => void
  row: CheckRow | null
}

export default function CheckDetailModal({ open, onClose, row }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!row) return null

  const initialJson =
    row.checklist_detail != null && Array.isArray(row.checklist_detail)
      ? JSON.stringify(row.checklist_detail)
      : null

  const initialNotes: CheckNotes = {
    입주시특이사항: row.move_in_notes ?? '',
    계약기간특이사항: row.contract_notes ?? '',
    퇴거시특이사항: row.move_out_notes ?? '',
  }

  const handlePhotoUpload = async (file: File): Promise<string> => {
    const blob = await compressImage(file, { maxWidth: 1600, quality: 0.8 })
    return uploadRoomCheckPhoto(blob, { phase: row.phase, roomNo: row.room_no })
  }

  const handleSave = async (result: ChecklistSaveResult) => {
    setError(null)
    setSaving(true)
    const res = await saveCheckDetailAction({
      id: row.id,
      checklistJson: result.checklistJson,
      okCount: result.okCount,
      needCount: result.needCount,
      moveInNotes: result.notes.입주시특이사항?.trim() || null,
      contractNotes: result.notes.계약기간특이사항?.trim() || null,
      moveOutNotes: result.notes.퇴거시특이사항?.trim() || null,
    })
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    startTransition(() => {
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`객실 체크 상세 — ${row.phase}차 ${row.room_no}`}
      size="xl"
    >
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <RoomChecklistDetail
        initialChecklistJson={initialJson}
        initialNotes={initialNotes}
        onPhotoUpload={handlePhotoUpload}
        onSave={handleSave}
        saving={saving}
      />
    </Modal>
  )
}
