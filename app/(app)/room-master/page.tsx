// 객실마스터 (/room-master) - Phase 9
// 관리자만 등록/수정/삭제 가능. 일반직원은 조회만.

import { createServerSupabase } from '@/lib/supabase/server'
import { listRooms, type RoomFilter } from '@/lib/queries/rooms'
import { getCurrentAppUser, isAdmin } from '@/lib/auth/current-user'
import PageHeader from '@/components/common/PageHeader'
import RoomTable from './RoomTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): RoomFilter => {
  const phase = pickStr(params.phase)
  return {
    phase: phase ? Number(phase) : null,
    roomNo: pickStr(params.room_no),
    type: pickStr(params.type),
  }
}

export default async function RoomMasterPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const user = await getCurrentAppUser()
  const rows = await listRooms(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="객실마스터"
        description="블루오션 레지던스 1차 ~ 4차 객실 정보를 관리합니다. 등록/수정은 관리자만 가능."
      />
      <RoomTable rows={rows} canEdit={isAdmin(user)} />
    </div>
  )
}
