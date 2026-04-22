// 계약 수정 (/contracts/[id]/edit) - Phase 13

import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getContract } from '@/lib/queries/contracts'
import { listBuyers } from '@/lib/queries/buyers'
import PageHeader from '@/components/common/PageHeader'
import ContractForm from '../../ContractForm'

export const dynamic = 'force-dynamic'

export default async function ContractEditPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const contract = await getContract(supabase, params.id)
  if (!contract) notFound()
  const buyers = await listBuyers(supabase, {})
  const options = buyers.map((b) => ({ id: b.id, name1: b.name1, buyer_no: b.buyer_no }))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={`${contract.phase}차 ${contract.room_no} 계약 수정`}
        description="계약 정보를 수정합니다."
      />
      <ContractForm mode="edit" initial={contract} buyers={options} />
    </div>
  )
}
