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

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="계약관리"
        description="블루오션 레지던스 분양 계약 목록입니다. 행을 클릭하면 상세 페이지로 이동합니다."
      />
      <ContractTable rows={rows} />
    </div>
  )
}
