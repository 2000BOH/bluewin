'use client'

// 민원접수 사이드패널. 차수+호수 입력 시 해당 객실의 현재 상태와 변경 이력을 표시한다.

import { useEffect, useState } from 'react'

type ActiveItem = {
  id: string
  title: string
  content: string | null
  status: string
  requester: string | null
  rnr_name: string | null
  urgency: string
  stay_type: string | null
  created_at: string
}

type CompletedItem = {
  id: string
  title: string
  content: string | null
  action_content: string | null
  requester: string | null
  rnr_name: string | null
  created_at: string
  completed_at: string | null
}

type ChangeItem = {
  id: string
  table_name: string
  field_name_ko: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  action: string
}

type PanelData = {
  active: ActiveItem[]
  completed: CompletedItem[]
  changeHistory: ChangeItem[]
}

const STATUS_COLOR: Record<string, string> = {
  접수: 'bg-blue-100 text-blue-700',
  영선: 'bg-orange-100 text-orange-700',
  외부업체: 'bg-purple-100 text-purple-700',
  퇴실: 'bg-gray-100 text-gray-600',
  청소: 'bg-sky-100 text-sky-700',
  완료: 'bg-green-100 text-green-700',
  처리중: 'bg-yellow-100 text-yellow-700',
}

const URGENCY_DOT: Record<string, string> = {
  긴급: 'bg-red-500',
  일반: 'bg-yellow-400',
  낮음: 'bg-gray-300',
}

const TABLE_KO: Record<string, string> = {
  contracts: '계약',
  maintenance_requests: '민원·영선',
  room_transfers: '객실이동',
  room_checks: '객실체크',
  room_maintenance_tasks: '객실정비',
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtShort = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function RoomStatusPanel({
  phase,
  roomNo,
}: {
  phase: string
  roomNo: string
}) {
  const [data, setData] = useState<PanelData | null>(null)
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

    fetch(`/api/room-complaints?phase=${encodeURIComponent(phase)}&room_no=${encodeURIComponent(roomNo)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json.error) { setNotFound(true); return }
        setData(json)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [phase, roomNo])

  // 빈 상태
  if (!phase || roomNo.length < 3) {
    return (
      <div className="flex flex-col gap-4">
        <PanelShell title="현재 객실 상태">
          <EmptyMsg>차수와 호수를 입력하면 현황이 표시됩니다.</EmptyMsg>
        </PanelShell>
        <PanelShell title="변경 이력">
          <EmptyMsg>차수와 호수를 입력하면 이력이 표시됩니다.</EmptyMsg>
        </PanelShell>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PanelShell title="현재 객실 상태">
          <EmptyMsg>조회 중…</EmptyMsg>
        </PanelShell>
        <PanelShell title="변경 이력">
          <EmptyMsg>조회 중…</EmptyMsg>
        </PanelShell>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="flex flex-col gap-4">
        <PanelShell title="현재 객실 상태">
          <EmptyMsg>해당 객실 정보가 없습니다.</EmptyMsg>
        </PanelShell>
        <PanelShell title="변경 이력">
          <EmptyMsg>해당 객실 정보가 없습니다.</EmptyMsg>
        </PanelShell>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── 현재 객실 상태 ── */}
      <PanelShell
        title="현재 객실 상태"
        badge={data.active.length > 0 ? `진행중 ${data.active.length}건` : undefined}
        badgeColor={data.active.length > 0 ? 'bg-red-100 text-red-700' : undefined}
      >
        {data.active.length === 0 ? (
          <EmptyMsg>진행 중인 민원이 없습니다.</EmptyMsg>
        ) : (
          <ul className="divide-y">
            {data.active.map((item) => (
              <li key={item.id} className="py-2.5 px-1">
                <div className="flex items-start gap-2">
                  {/* 긴급도 도트 */}
                  <span
                    className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${URGENCY_DOT[item.urgency] ?? 'bg-gray-300'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {item.status}
                      </span>
                      {item.urgency === '긴급' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                          긴급
                        </span>
                      )}
                    </div>
                    {item.content && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span>접수 {fmtShort(item.created_at)}</span>
                      {item.requester && <span>· 접수자: {item.requester}</span>}
                      {item.rnr_name && <span>· 담당: {item.rnr_name}</span>}
                      {item.stay_type && <span>· {item.stay_type.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelShell>

      {/* ── 처리 이력 ── */}
      <PanelShell title="처리 이력" badge={data.completed.length > 0 ? `완료 ${data.completed.length}건` : undefined}>
        {data.completed.length === 0 ? (
          <EmptyMsg>완료된 처리 내역이 없습니다.</EmptyMsg>
        ) : (
          <ul className="divide-y">
            {data.completed.map((item) => (
              <li key={item.id} className="py-2.5 px-1">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-green-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                        완료
                      </span>
                    </div>
                    {item.content && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                    )}
                    {item.action_content && (
                      <p className="mt-0.5 text-xs text-foreground/80 line-clamp-2">
                        → {item.action_content}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span>접수 {fmtShort(item.created_at)}</span>
                      {item.completed_at && <span>· 완료 {fmtShort(item.completed_at)}</span>}
                      {item.requester && <span>· {item.requester}</span>}
                      {item.rnr_name && <span>· 담당: {item.rnr_name}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelShell>

      {/* ── 변경 이력 ── */}
      {data.changeHistory.length > 0 && (
        <PanelShell title="변경 이력">
          <ul className="divide-y">
            {data.changeHistory.map((item) => (
              <li key={item.id} className="py-2 px-1">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-300" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap text-sm">
                      <span className="text-[10px] text-muted-foreground border rounded px-1">
                        {TABLE_KO[item.table_name] ?? item.table_name}
                      </span>
                      {item.field_name_ko && (
                        <span className="font-medium">{item.field_name_ko}</span>
                      )}
                      {item.action === 'insert' ? (
                        <span className="text-xs text-muted-foreground">신규 등록</span>
                      ) : item.action === 'delete' ? (
                        <span className="text-xs text-destructive">삭제</span>
                      ) : (
                        <>
                          {item.old_value && (
                            <span className="text-xs line-through text-muted-foreground">
                              {item.old_value}
                            </span>
                          )}
                          {item.old_value && item.new_value && <span className="text-muted-foreground">→</span>}
                          {item.new_value && (
                            <span className="text-xs font-medium text-foreground">
                              {item.new_value}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{fmtDate(item.changed_at)}</span>
                      {item.changed_by && <span>· {item.changed_by}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </PanelShell>
      )}
    </div>
  )
}

function PanelShell({
  title,
  badge,
  badgeColor,
  children,
}: {
  title: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30 rounded-t-lg">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColor ?? 'bg-muted text-muted-foreground'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-3 py-1 max-h-64 overflow-y-auto">{children}</div>
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-xs text-muted-foreground">{children}</p>
}
