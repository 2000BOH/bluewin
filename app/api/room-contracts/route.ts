// GET /api/room-contracts?phase=1&room_no=301
// 클라이언트 컴포넌트에서 fetch 로 호출 → 해당 객실의 숙박계약서 파일 목록(최신순) 반환.

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { listRoomContractFiles } from '@/lib/queries/room-contracts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phaseRaw = searchParams.get('phase')
    const roomNo = searchParams.get('room_no')?.trim() ?? ''
    const phase = Number(phaseRaw)

    if (!Number.isFinite(phase) || phase <= 0 || !roomNo) {
      return NextResponse.json({ error: 'phase/room_no 누락' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const rows = await listRoomContractFiles(supabase, phase, roomNo)
    return NextResponse.json({ rows })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
