'use client'

import { useState } from 'react'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/format'
import { maskAccountNo, maskBusinessNo } from '@/lib/utils/mask'
import type { ContractRow } from '@/lib/queries/contracts'
import type { BuyerRow } from '@/lib/queries/buyers'
import type { Database } from '@/types/supabase'

type HistoryRow = Database['public']['Tables']['change_history']['Row']
type Tab = 'basic' | 'cost' | 'finance' | 'lease' | 'history'

type Props = {
  contract: ContractRow
  buyer: BuyerRow | null
  history: HistoryRow[]
  isAdmin: boolean
}

const TAB_LABELS: Record<Tab, string> = {
  basic: '계약/운영기본',
  cost: '초기비용/입주',
  finance: '금융/세금',
  lease: '임차정보',
  history: '수정이력',
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 font-medium">{value || <span className="text-muted-foreground">-</span>}</div>
  </div>
)

export default function ContractDetailTabs({ contract, buyer, history, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>('basic')

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="-mb-px flex flex-wrap gap-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-lg border bg-card p-4">
        {tab === 'basic' && (
          <div>
            <Row label="차수" value={`${contract.phase}차`} />
            <Row label="호수" value={contract.room_no} />
            <Row label="계약번호" value={contract.contract_no} />
            <Row label="계약자" value={buyer ? `[${buyer.buyer_no}] ${buyer.name1}` : contract.buyer_id} />
            <Row label="계약형태" value={contract.contract_form} />
            <Row label="계약일" value={formatDate(contract.contract_date)} />
            <Row label="운영방식" value={contract.operation_type} />
            <Row label="운영시작" value={formatDate(contract.operation_start)} />
            <Row label="운영종료" value={formatDate(contract.operation_end)} />
            <Row label="숙박형태" value={contract.accommodation_type} />
            <Row label="역발행" value={contract.reverse_issuance ? '예' : '아니오'} />
            <Row label="비고" value={contract.note} />
          </div>
        )}

        {tab === 'cost' && (
          <div>
            <Row label="초기비용" value={formatCurrency(contract.initial_cost)} />
            <Row label="입주일" value={formatDate(contract.move_in_date)} />
          </div>
        )}

        {tab === 'finance' && (
          <div>
            <Row label="입금은행" value={contract.account_bank} />
            <Row
              label="계좌번호"
              value={isAdmin ? contract.account_no : maskAccountNo(contract.account_no)}
            />
            <Row
              label="사업자번호"
              value={isAdmin ? contract.business_no : maskBusinessNo(contract.business_no)}
            />
            {!isAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">
                ※ 일반직원에게는 계좌/사업자번호가 마스킹되어 표시됩니다.
              </p>
            )}
          </div>
        )}

        {tab === 'lease' && (
          <div>
            <Row label="임차인" value={contract.tenant_name} />
            <Row label="임차인 연락처" value={contract.tenant_phone} />
            <Row label="임대시작" value={formatDate(contract.lease_start)} />
            <Row label="임대종료" value={formatDate(contract.lease_end)} />
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">수정 이력이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">시각</th>
                      <th className="px-2 py-2 text-left">필드</th>
                      <th className="px-2 py-2 text-left">변경전</th>
                      <th className="px-2 py-2 text-left">변경후</th>
                      <th className="px-2 py-2 text-left">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-t">
                        <td className="px-2 py-2 font-mono">{formatDateTime(h.changed_at)}</td>
                        <td className="px-2 py-2">{h.field_name_ko ?? '-'}</td>
                        <td className="px-2 py-2 text-muted-foreground">{String(h.old_value ?? '')}</td>
                        <td className="px-2 py-2">{String(h.new_value ?? '')}</td>
                        <td className="px-2 py-2 uppercase">{h.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
