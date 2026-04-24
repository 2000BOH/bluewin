'use client'

// 계약 상세 — 7탭 구성.
// 탭 1 계약기본 / 2 운영정보 / 3 초기비용·입주 / 4 금융·세금(마스킹)
// 탭 5 임차정보 / 6 민원·비고 / 7 수정이력
//
// 민원·비고 탭: `note` (민원내용 의미) + 같은 차수/호수의 maintenance_requests 목록.
// 금융·세금 탭: 일반직원은 계좌번호/사업자등록번호 마스킹, 관리자는 원본 노출.

import Link from 'next/link'
import { useState } from 'react'
import {
  formatDate,
  formatDateTime,
  formatCurrency,
} from '@/lib/utils/format'
import { maskAccountNo, maskBusinessNo } from '@/lib/utils/mask'
import StatusBadge from '@/components/common/StatusBadge'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import type { ContractRow } from '@/lib/queries/contracts'
import type { BuyerRow } from '@/lib/queries/buyers'
import type { CommonStatus, Database, RnrStaffNoEnum } from '@/types/supabase'

type HistoryRow = Database['public']['Tables']['change_history']['Row']

export type ComplaintSummary = {
  id: string
  phase: number
  room_no: string
  title: string
  content: string | null
  status: CommonStatus
  stay_type: string | null
  rnr_no: RnrStaffNoEnum | null
  requester: string | null
  created_at: string
  source: string
}

type Tab = 'basic' | 'operation' | 'cost' | 'finance' | 'lease' | 'complaint' | 'history'

type Props = {
  contract: ContractRow
  buyer: BuyerRow | null
  complaints: ComplaintSummary[]
  history: HistoryRow[]
  isAdmin: boolean
}

const TAB_LABELS: Record<Tab, string> = {
  basic: '① 계약기본',
  operation: '② 운영정보',
  cost: '③ 초기비용/입주',
  finance: '④ 금융/세금',
  lease: '⑤ 임차정보',
  complaint: '⑥ 민원/비고',
  history: '⑦ 수정이력',
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 border-b py-2 text-sm last:border-0">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 font-medium">{value || <span className="text-muted-foreground">-</span>}</div>
  </div>
)

export default function ContractDetailTabs({
  contract,
  buyer,
  complaints,
  history,
  isAdmin,
}: Props) {
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
            <Row label="계약자번호" value={buyer?.buyer_no ?? '-'} />
            <Row label="계약자명" value={buyer ? buyer.name1 : contract.buyer_id} />
            <Row label="개인/법인" value={buyer?.buyer_type ?? '-'} />
            <Row label="차수" value={`${contract.phase}차`} />
            <Row label="호수" value={contract.room_no} />
            <Row label="계약번호" value={contract.contract_no} />
            <Row label="계약상태" value={contract.contract_status} />
            <Row label="계약형태" value={contract.contract_form} />
            <Row label="계약일" value={formatDate(contract.contract_date)} />
            <Row label="계약(잔금)일" value={formatDate(contract.settlement_date)} />
            <Row label="총공급금액" value={contract.total_supply_amount != null ? formatCurrency(contract.total_supply_amount) : '-'} />
            <Row label="역발행여부" value={contract.reverse_issuance ? '역발행' : '정발행'} />
            <Row label="위탁일" value={formatDate(contract.entrustment_date)} />
          </div>
        )}

        {tab === 'operation' && (
          <div>
            <Row label="운영방식" value={contract.operation_type} />
            <Row label="운영시작일" value={formatDate(contract.operation_start)} />
            <Row label="운영종료일" value={formatDate(contract.operation_end)} />
            <Row label="확정지급액" value={contract.settlement_amount != null ? formatCurrency(contract.settlement_amount) : '-'} />
            <Row label="수수료금액" value={contract.commission_amount != null ? formatCurrency(contract.commission_amount) : '-'} />
            <Row label="렌트프리기간" value={contract.rent_free_months != null ? `${contract.rent_free_months}개월` : '-'} />
            <Row label="숙박동의서" value={contract.stay_agreement ? '제출' : '미제출'} />
          </div>
        )}

        {tab === 'cost' && (
          <div>
            <Row label="초기비용 합계" value={contract.initial_cost != null ? formatCurrency(contract.initial_cost) : '-'} />
            <Row label="선수관리비납부" value={contract.prepaid_mgmt_fee != null ? formatCurrency(contract.prepaid_mgmt_fee) : '-'} />
            <Row label="비품비납입금" value={contract.furniture_fee != null ? formatCurrency(contract.furniture_fee) : '-'} />
            <Row label="가구공동구매입금" value={contract.joint_purchase_fee != null ? formatCurrency(contract.joint_purchase_fee) : '-'} />
            <Row label="선수관리예치금" value={contract.prepaid_mgmt_deposit != null ? formatCurrency(contract.prepaid_mgmt_deposit) : '-'} />
            <Row label="현금영수증역발행" value={contract.cash_receipt_reverse ? '역발행' : '정발행'} />
            <Row label="입주일" value={formatDate(contract.move_in_date)} />
          </div>
        )}

        {tab === 'finance' && (
          <div>
            <Row label="은행" value={contract.account_bank} />
            <Row label="계좌성명" value={contract.account_holder_name} />
            <Row
              label="계좌번호"
              value={isAdmin ? contract.account_no : maskAccountNo(contract.account_no)}
            />
            <Row
              label="사업자등록번호"
              value={isAdmin ? contract.business_no : maskBusinessNo(contract.business_no)}
            />
            <Row label="상호" value={contract.business_name} />
            <Row label="대표자" value={contract.representative_name} />
            {!isAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">
                ※ 일반직원에게는 계좌/사업자번호가 마스킹되어 표시됩니다.
              </p>
            )}
          </div>
        )}

        {tab === 'lease' && (
          <div>
            <Row label="숙박형태" value={<StayTypeBadge stayType={contract.accommodation_type} size="sm" />} />
            <Row label="임차인" value={contract.tenant_name} />
            <Row label="임차인 연락처" value={contract.tenant_phone} />
            <Row label="보증금" value={contract.deposit_amount != null ? formatCurrency(contract.deposit_amount) : '-'} />
            <Row label="임대료" value={contract.monthly_rent != null ? formatCurrency(contract.monthly_rent) : '-'} />
            <Row label="임대시작" value={formatDate(contract.lease_start)} />
            <Row label="임대종료" value={formatDate(contract.lease_end)} />
          </div>
        )}

        {tab === 'complaint' && (
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-sm font-medium">비고 (민원 메모)</div>
              <p className="whitespace-pre-wrap rounded border bg-muted/30 p-3 text-sm">
                {contract.note ?? <span className="text-muted-foreground">(없음)</span>}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                이 객실의 민원/영선 이력 ({complaints.length}건)
              </div>
              <Link
                href={`/complaint?phase=${contract.phase}&room_no=${contract.room_no}`}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                ＋ 신규 민원 등록
              </Link>
            </div>

            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 민원이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2">접수일시</th>
                      <th className="px-2 py-2">출처</th>
                      <th className="px-2 py-2">제목</th>
                      <th className="px-2 py-2">요청자</th>
                      <th className="px-2 py-2">숙박형태</th>
                      <th className="px-2 py-2">R&R</th>
                      <th className="px-2 py-2">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-2 py-2 font-mono">{formatDateTime(c.created_at)}</td>
                        <td className="px-2 py-2 text-muted-foreground">{c.source}</td>
                        <td className="px-2 py-2">{c.title}</td>
                        <td className="px-2 py-2">{c.requester ?? '-'}</td>
                        <td className="px-2 py-2">
                          <StayTypeBadge stayType={c.stay_type} size="sm" />
                        </td>
                        <td className="px-2 py-2">{c.rnr_no ?? '-'}</td>
                        <td className="px-2 py-2">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
