// 계약 상세 (/contracts/[id]) - Phase 12

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getContract } from '@/lib/queries/contracts'
import { getBuyer } from '@/lib/queries/buyers'
import { getCurrentAppUser, isAdmin } from '@/lib/auth/current-user'
import PageHeader from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import ContractDetailTabs from './ContractDetailTabs'
import type { Database } from '@/types/supabase'

type HistoryRow = Database['public']['Tables']['change_history']['Row']

export const dynamic = 'force-dynamic'

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const contract = await getContract(supabase, params.id)
  if (!contract) notFound()

  const [buyer, user, historyRes] = await Promise.all([
    getBuyer(supabase, contract.buyer_id),
    getCurrentAppUser(),
    supabase
      .from('change_history')
      .select('*')
      .eq('table_name', 'contracts')
      .eq('record_id', params.id)
      .order('changed_at', { ascending: false })
      .limit(200),
  ])
  const history = (historyRes.data ?? []) as HistoryRow[]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={`${contract.phase}차 ${contract.room_no} 계약 상세`}
        description={contract.contract_no ? `계약번호 ${contract.contract_no}` : '계약 정보'}
        actions={
          <Button asChild size="sm">
            <Link href={`/contracts/${contract.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" /> 수정
            </Link>
          </Button>
        }
      />
      <ContractDetailTabs
        contract={contract}
        buyer={buyer}
        history={history}
        isAdmin={isAdmin(user)}
      />
    </div>
  )
}
