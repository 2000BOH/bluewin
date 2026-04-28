import { useState, useRef, useCallback, useEffect } from 'react'

export type UseRoomInputOptions = {
  initialPhase?: string
  initialRoomNo?: string
  onAutoFetch?: (phase: string, roomNo: string) => void
}

export function useRoomInput({
  initialPhase = '',
  initialRoomNo = '',
  onAutoFetch,
}: UseRoomInputOptions = {}) {
  const [phase, setPhase] = useState(initialPhase)
  const [roomNo, setRoomNo] = useState(initialRoomNo)

  const phaseRef = useRef(initialPhase)
  const roomNoRef = useRef<HTMLInputElement>(null)
  const roomIsComposing = useRef(false)

  // 부모에서 초기값이 변경될 때 동기화
  useEffect(() => {
    if (initialPhase) {
      setPhase(initialPhase)
      phaseRef.current = initialPhase
    }
  }, [initialPhase])

  useEffect(() => {
    if (initialRoomNo) {
      setRoomNo(initialRoomNo)
    }
  }, [initialRoomNo])

  const handlePhaseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setPhase(val)
      phaseRef.current = val

      // 1자리 숫자 입력 시 호수로 포커스 이동
      if (/^\d$/.test(val)) {
        roomNoRef.current?.focus()
      }

      if (roomNo.length >= 3 && onAutoFetch) {
        onAutoFetch(val, roomNo)
      } else if (onAutoFetch && roomNo.length < 3) {
        onAutoFetch(val, '')
      }
    },
    [roomNo, onAutoFetch]
  )

  const handleRoomNoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setRoomNo(val)

      // IME 조합 중이 아닐 때 3자리 이상이면 트리거
      if (!roomIsComposing.current) {
        if (val.length >= 3 && onAutoFetch) {
          onAutoFetch(phaseRef.current, val)
        } else if (val.length < 3 && onAutoFetch) {
          onAutoFetch(phaseRef.current, '')
        }
      }
    },
    [onAutoFetch]
  )

  const handleRoomCompositionStart = useCallback(() => {
    roomIsComposing.current = true
  }, [])

  const handleRoomCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      roomIsComposing.current = false
      const val = e.currentTarget.value
      if (val.length >= 3 && onAutoFetch) {
        onAutoFetch(phaseRef.current, val)
      } else if (val.length < 3 && onAutoFetch) {
        onAutoFetch(phaseRef.current, '')
      }
    },
    [onAutoFetch]
  )

  return {
    phase,
    roomNo,
    setPhase,
    setRoomNo,
    roomNoRef,
    handlePhaseChange,
    handleRoomNoChange,
    handleRoomCompositionStart,
    handleRoomCompositionEnd,
  }
}
