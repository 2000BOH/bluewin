'use client'

// 구버전 상세 체크 모달 — CheckTable 리아키텍처 후 미사용. 컴파일 유지용.

import Modal from '@/components/common/Modal'
import type { CheckRow } from '@/lib/queries/room-check'

type Props = {
  open: boolean
  onClose: () => void
  row: CheckRow | null
}

export default function CheckDetailModal({ open, onClose, row }: Props) {
  if (!row) return null
  return (
    <Modal open={open} onClose={onClose} title={`${row.phase}차 ${row.room_no}`}>
      <p className="text-sm text-muted-foreground">이 기능은 더 이상 사용되지 않습니다.</p>
    </Modal>
  )
}
