// 계약관리 목록 (/contracts) - Phase 11
// 기본 11개 컬럼 표시 (CLAUDE.md 기준).

import { createServerSupabase } from '@/lib/supabase/server'
import { listContracts, type ContractFilter } from '@/lib/queries/contracts'
import PageHeader from '@/components/common/PageHeader'
import ContractTable from './ContractTable'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): ContractFilter => {
  const phase = pickStr(params.phase)
  const reverse = pickStr(params.reverse_issuance)
  return {
    phase: phase ? Number(phase) : null,
    roomNo: pickStr(params.room_no),
    viewType: pickStr(params.view_type),
    buyerName: pickStr(params.buyer_name),
    reverseIssuance: reverse === 'true' ? true : reverse === 'false' ? false : null,
    operationType: pickStr(params.operation_type),
    contractForm: pickStr(params.contract_form),
    accommodationType: pickStr(params.accommodation_type),
  }
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listContracts(supabase, buildFilter(searchParams))

  // 인라인 편집기에 필요한 계약자 옵션 (buyer_id Select).
  const { data: buyersData } = await supabase
    .from('buyers')
    .select('id, name1, buyer_no')
    .order('buyer_no', { ascending: true })
    .limit(2000)
  const buyerOptions = (buyersData ?? []).map((b) => ({
    id: b.id,
    name1: b.name1 ?? '',
    buyer_no: b.buyer_no ?? '',
  }))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="계약관리"
        description="블루오션 레지던스 분양 계약 목록입니다. 행 끝의 펼치기 아이콘으로 전체 컬럼을 보고 인라인 수정할 수 있습니다."
      />
      <ContractTable rows={rows} buyerOptions={buyerOptions} />
    </div>
  )
}
