// 계약 수정 (/contracts/[id]/edit) - Phase 13

import { notFound, redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getContract } from '@/lib/queries/contracts'
import { listBuyers } from '@/lib/queries/buyers'
import PageHeader from '@/components/common/PageHeader'
import ContractForm from '../../ContractForm'

export const dynamic = 'force-dynamic'

export default async function ContractEditPage({ params }: { params: { id: string } }) {
  // 잘못된 id 값(예: 'undefined')으로 접근 시 목록으로 리다이렉트
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!params.id || !UUID_REGEX.test(params.id)) redirect('/contracts')

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
