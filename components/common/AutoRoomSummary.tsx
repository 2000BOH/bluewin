'use client'

import { useEffect, useState } from 'react'

type Props = {
  phase: string
  roomNo: string
}

type RoomSummary = {
  contract_status: string | null
  accommodation_type: string | null
  operation_type: string | null
  tenant_name: string | null
}

export default function AutoRoomSummary({ phase, roomNo }: Props) {
  const [data, setData] = useState<RoomSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!phase || roomNo.length < 3) {
      setData(null)
      setNotFound(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)

    const params = new URLSearchParams({ phase, room_no: roomNo })
    fetch(`/api/room-info?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.error || !json.found) {
          setNotFound(true)
          setData(null)
        } else {
          setData({
            contract_status: json.contract_status,
            accommodation_type: json.accommodation_type,
            operation_type: json.operation_type,
            tenant_name: json.tenant_name,
          })
          setNotFound(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true)
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [phase, roomNo])

  if (!phase || roomNo.length < 3) return null

  return (
    <div className="mt-2 text-xs">
      {loading ? (
        <span className="text-muted-foreground">조회 중...</span>
      ) : notFound ? (
        <span className="text-destructive font-medium">조회된 객실정보가 없습니다.</span>
      ) : data ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-muted/30 px-3 py-2 rounded border border-muted/50 text-foreground/80">
          {data.contract_status && (
            <span>
              계약: <span className="font-medium text-foreground">{data.contract_status}</span>
            </span>
          )}
          {data.operation_type && (
            <span>
              운영: <span className="font-medium text-foreground">{data.operation_type}</span>
            </span>
          )}
          {data.accommodation_type && (
            <span>
              숙박: <span className="font-medium text-foreground">{data.accommodation_type.replace('_', ' ')}</span>
            </span>
          )}
          {data.tenant_name && (
            <span>
              임대인: <span className="font-medium text-foreground">{data.tenant_name}</span>
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
