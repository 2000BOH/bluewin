'use client'

// 민원접수 페이지 클라이언트 래퍼.
// ComplaintForm 과 RoomStatusPanel 이 phase/roomNo 상태를 공유한다.

import { useState } from 'react'
import ComplaintForm from './ComplaintForm'
import RoomStatusPanel from './RoomStatusPanel'

export default function ComplaintPageClient() {
  const [phase, setPhase] = useState('')
  const [roomNo, setRoomNo] = useState('')

  return (
    <div className="flex gap-5 items-start">
      {/* 민원 접수 폼 */}
      <div className="w-full max-w-xl flex-shrink-0">
        <ComplaintForm
          onRoomChange={(p, r) => {
            setPhase(p)
            setRoomNo(r)
          }}
        />
      </div>

      {/* 객실 현황 + 이력 사이드패널 */}
      <div className="flex-1 min-w-0">
        <RoomStatusPanel phase={phase} roomNo={roomNo} />
      </div>
    </div>
  )
}
