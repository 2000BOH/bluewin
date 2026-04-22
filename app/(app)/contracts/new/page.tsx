// 계약 신규 등록 (/contracts/new) - Phase 13

import { createServerSupabase } from '@/lib/supabase/server'
import { listBuyers } from '@/lib/queries/buyers'
import PageHeader from '@/components/common/PageHeader'
import ContractForm from '../ContractForm'

export const dynamic = 'force-dynamic'

export default async function NewContractPage() {
  const supabase = createServerSupabase()
  const buyers = await listBuyers(supabase, {})
  const options = buyers.map((b) => ({ id: b.id, name1: b.name1, buyer_no: b.buyer_no }))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader title="계약 신규 등록" description="새 계약 정보를 입력합니다." />
      <ContractForm mode="create" buyers={options} />
    </div>
  )
}
