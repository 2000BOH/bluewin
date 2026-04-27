// 민원접수 사이드패널용 API.
// 차수+호수 기준으로 진행중 민원, 완료 이력, 객실 변경 이력을 한번에 반환한다.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { RNR_STAFF_MAPPING, type RnrStaffNo } from '@/types/status'

export async function GET(req: NextRequest) {
  const phase = req.nextUrl.searchParams.get('phase')
  const room_no = req.nextUrl.searchParams.get('room_no')

  if (!phase || !room_no) {
    return NextResponse.json({ error: 'phase, room_no 필수' }, { status: 400 })
  }

  const phaseNum = Number(phase)
  if (!Number.isFinite(phaseNum) || phaseNum <= 0) {
    return NextResponse.json({ error: '차수가 올바르지 않습니다.' }, { status: 400 })
  }

  const roomNoTrimmed = room_no.trim()

  try {
    const supabase = createServiceSupabase()

    // 1. 해당 객실의 모든 민원 요청 조회 (최근 50건)
    const { data: requests, error: reqErr } = await supabase
      .from('maintenance_requests')
      .select('id, title, content, status, requester, rnr_no, urgency, action_content, created_at, completed_at, stay_type')
      .eq('phase', phaseNum)
      .eq('room_no', roomNoTrimmed)
      .order('created_at', { ascending: false })
      .limit(50)

    if (reqErr) {
      console.error('[room-complaints] requests 조회 오류:', reqErr.message)
    }

    const allRequests = requests ?? []
    const active = allRequests.filter((r) => r.status !== '완료')
    const completed = allRequests.filter((r) => r.status === '완료').slice(0, 15)

    // 2. 담당자 이름 맵 — types/status.ts RNR_STAFF_MAPPING 단일 원천 사용
    const rnrNameMap: Record<string, string> = Object.fromEntries(
      Object.entries(RNR_STAFF_MAPPING).map(([no, name]) => [no, name || no])
    )

    // 3. 해당 객실 계약 id 조회
    const { data: contractRow } = await supabase
      .from('contracts')
      .select('id')
      .eq('phase', phaseNum)
      .eq('room_no', roomNoTrimmed)
      .maybeSingle()

    // 4. change_history: 계약 + 민원요청 변경 이력 조회
    const targetIds: string[] = []
    if (contractRow?.id) targetIds.push(contractRow.id)
    for (const r of allRequests.slice(0, 20)) targetIds.push(r.id)

    let changeHistory: {
      id: string
      table_name: string
      field_name_ko: string | null
      old_value: string | null
      new_value: string | null
      changed_by: string | null
      changed_at: string
      action: string
    }[] = []

    if (targetIds.length > 0) {
      const { data: chRows } = await supabase
        .from('change_history')
        .select('id, table_name, record_id, field_name_ko, old_value, new_value, changed_by, changed_at, action')
        .in('record_id', targetIds)
        .order('changed_at', { ascending: false })
        .limit(30)

      // changed_by UUID → 이름 변환
      const changerIds = Array.from(new Set((chRows ?? []).map((r) => r.changed_by).filter(Boolean))) as string[]
      const userNameMap: Record<string, string> = {}
      if (changerIds.length > 0) {
        const { data: userRows } = await supabase
          .from('users')
          .select('id, name')
          .in('id', changerIds)
        for (const u of userRows ?? []) userNameMap[u.id] = u.name
      }

      changeHistory = (chRows ?? []).map((r) => ({
        id: r.id,
        table_name: r.table_name,
        field_name_ko: r.field_name_ko,
        old_value: r.old_value != null ? String(r.old_value) : null,
        new_value: r.new_value != null ? String(r.new_value) : null,
        changed_by: r.changed_by ? (userNameMap[r.changed_by] ?? r.changed_by) : null,
        changed_at: r.changed_at,
        action: r.action,
      }))
    }

    return NextResponse.json({
      active: active.map((r) => ({
        ...r,
        rnr_name: r.rnr_no ? (rnrNameMap[r.rnr_no] ?? r.rnr_no) : null,
      })),
      completed: completed.map((r) => ({
        ...r,
        rnr_name: r.rnr_no ? (rnrNameMap[r.rnr_no] ?? r.rnr_no) : null,
      })),
      changeHistory,
    })
  } catch (e) {
    console.error('[room-complaints] 예외:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
