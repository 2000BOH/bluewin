'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import RoomFilterBar from '@/components/common/RoomFilterBar'

type Props = {
  defaults: {
    dateFrom: string
    dateTo: string
    done: string
    requester: string
    status: string
  }
}

export default function InboxFilterBar({ defaults }: Props) {
  const router = useRouter()
  const [dateFrom,  setDateFrom]  = useState(defaults.dateFrom)
  const [dateTo,    setDateTo]    = useState(defaults.dateTo)
  const [done,      setDone]      = useState(defaults.done)
  const [requester, setRequester] = useState(defaults.requester)
  const [status,    setStatus]    = useState(defaults.status)

  const navigate = useCallback(
    (ov: Partial<{ dateFrom: string; dateTo: string; done: string; requester: string; status: string }> = {}) => {
      const p = new URLSearchParams()
      const f  = 'dateFrom'  in ov ? ov.dateFrom  : dateFrom
      const t  = 'dateTo'    in ov ? ov.dateTo    : dateTo
      const d  = 'done'      in ov ? ov.done      : done
      const rq = 'requester' in ov ? ov.requester : requester
      const st = 'status'    in ov ? ov.status    : status
      if (f)  p.set('dateFrom',  f)
      if (t)  p.set('dateTo',    t)
      if (d)  p.set('done',      d)
      if (rq) p.set('requester', rq)
      if (st) p.set('status',    st)
      router.push(`/maintenance/inbox?${p.toString()}`)
    },
    [dateFrom, dateTo, done, requester, status, router],
  )

  const reset = () => {
    setDateFrom(''); setDateTo(''); setDone(''); setRequester(''); setStatus('')
    router.push('/maintenance/inbox')
  }

  return (
    <RoomFilterBar
      done={done}              onDoneChange={setDone}
      receiverLabel="접수자"
      receiver={requester}     onReceiverChange={setRequester}
      status={status}          onStatusChange={setStatus}
      dateFrom={dateFrom}      onDateFromChange={setDateFrom}
      dateTo={dateTo}          onDateToChange={setDateTo}
      onSearch={() => navigate()}
      onReset={reset}
    />
  )
}
