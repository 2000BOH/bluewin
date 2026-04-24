'use client'

// 계약관리 목록 — 기본 11 컬럼 고정 + 펼치기 토글로 추가 컬럼 표시.
// 추가 컬럼 선택 상태는 localStorage("col-toggle:contracts") 에 저장된다.

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, TextInput, Select } from '@/components/common/FormField'
import EmptyState from '@/components/common/EmptyState'
import StayTypeBadge from '@/components/common/StayTypeBadge'
import ColumnToggle, {
  useColumnToggle,
  type ColumnSpec,
} from '@/components/common/ColumnToggle'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import type { ContractListItem } from '@/lib/queries/contracts'
import { Plus, RefreshCw, Search } from 'lucide-react'

type Props = { rows: ContractListItem[] }

// 펼치기 토글 대상 추가 컬럼 정의. (기본 11개 외)
const EXTENDED_COLUMNS: ColumnSpec[] = [
  { key: 'sale_area', label: '분양면적(㎡)' },
  { key: 'total_supply', label: '총공급금액' },
  { key: 'buyer_no', label: '계약자번호' },
  { key: 'buyer_type', label: '개인/법인' },
  { key: 'contract_status', label: '계약상태' },
  { key: 'settlement_date', label: '계약(잔금)일' },
  { key: 'operation_start', label: '운영시작일' },
  { key: 'operation_type', label: '운영방식' },
  { key: 'settlement_amount', label: '확정지급액' },
  { key: 'commission_amount', label: '수수료금액' },
  { key: 'contract_form', label: '계약형태' },
  { key: 'reverse_issuance', label: '역발행여부' },
  { key: 'entrustment_date', label: '위탁일' },
  { key: 'rent_free_months', label: '렌트프리기간' },
  { key: 'prepaid_mgmt_fee', label: '선수관리비납부' },
  { key: 'furniture_fee', label: '비품비납입금' },
  { key: 'joint_purchase_fee', label: '가구공동구매입금' },
  { key: 'stay_agreement', label: '숙박동의서' },
  { key: 'prepaid_mgmt_deposit', label: '선수관리예치금' },
  { key: 'cash_receipt_reverse', label: '현금영수증역발행' },
  { key: 'account_bank', label: '은행' },
  { key: 'account_holder_name', label: '계좌성명' },
  { key: 'account_no', label: '계좌번호' },
  { key: 'business_no', label: '사업자등록번호' },
  { key: 'business_name', label: '상호' },
  { key: 'representative_name', label: '대표자' },
  { key: 'deposit_amount', label: '보증금' },
  { key: 'monthly_rent', label: '임대료' },
  { key: 'lease_start', label: '임대시작' },
]

const computeTotalSupply = (r: ContractListItem): number | null => {
  if (r.total_supply_amount != null) return r.total_supply_amount
  // 폴백: rooms.sale_price_incl_vat.
  return r.sale_price_incl_vat ?? null
}

const renderExt = (key: string, r: ContractListItem): React.ReactNode => {
  switch (key) {
    case 'sale_area': return r.sale_area ?? '-'
    case 'total_supply': {
      const v = computeTotalSupply(r)
      return v != null ? formatCurrency(v) : '-'
    }
    case 'buyer_no': return r.buyer_no ?? '-'
    case 'buyer_type': return r.buyer_type ?? '-'
    case 'contract_status': return r.contract_status ?? '-'
    case 'settlement_date': return formatDate(r.settlement_date)
    case 'operation_start': return formatDate(r.operation_start)
    case 'operation_type': return r.operation_type ?? '-'
    case 'settlement_amount': return r.settlement_amount != null ? formatCurrency(r.settlement_amount) : '-'
    case 'commission_amount': return r.commission_amount != null ? formatCurrency(r.commission_amount) : '-'
    case 'contract_form': return r.contract_form ?? '-'
    case 'reverse_issuance': return r.reverse_issuance ? '역발행' : '정발행'
    case 'entrustment_date': return formatDate(r.entrustment_date)
    case 'rent_free_months': return r.rent_free_months != null ? `${r.rent_free_months}개월` : '-'
    case 'prepaid_mgmt_fee': return r.prepaid_mgmt_fee != null ? formatCurrency(r.prepaid_mgmt_fee) : '-'
    case 'furniture_fee': return r.furniture_fee != null ? formatCurrency(r.furniture_fee) : '-'
    case 'joint_purchase_fee': return r.joint_purchase_fee != null ? formatCurrency(r.joint_purchase_fee) : '-'
    case 'stay_agreement': return r.stay_agreement ? '제출' : '미제출'
    case 'prepaid_mgmt_deposit': return r.prepaid_mgmt_deposit != null ? formatCurrency(r.prepaid_mgmt_deposit) : '-'
    case 'cash_receipt_reverse': return r.cash_receipt_reverse ? '역발행' : '정발행'
    case 'account_bank': return r.account_bank ?? '-'
    case 'account_holder_name': return r.account_holder_name ?? '-'
    case 'account_no': return r.account_no ?? '-'
    case 'business_no': return r.business_no ?? '-'
    case 'business_name': return r.business_name ?? '-'
    case 'representative_name': return r.representative_name ?? '-'
    case 'deposit_amount': return r.deposit_amount != null ? formatCurrency(r.deposit_amount) : '-'
    case 'monthly_rent': return r.monthly_rent != null ? formatCurrency(r.monthly_rent) : '-'
    case 'lease_start': return formatDate(r.lease_start)
    default: return '-'
  }
}

export default function ContractTable({ rows }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [phase, setPhase] = useState(params.get('phase') ?? '')
  const [roomNo, setRoomNo] = useState(params.get('room_no') ?? '')
  const [viewType, setViewType] = useState(params.get('view_type') ?? '')
  const [buyerName, setBuyerName] = useState(params.get('buyer_name') ?? '')
  const [reverse, setReverse] = useState(params.get('reverse_issuance') ?? '')
  const [opType, setOpType] = useState(params.get('operation_type') ?? '')
  const [cForm, setCForm] = useState(params.get('contract_form') ?? '')
  const [accType, setAccType] = useState(params.get('accommodation_type') ?? '')

  const [visibleExt, setVisibleExt] = useColumnToggle('contracts', [])

  const apply = () => {
    const sp = new URLSearchParams()
    if (phase) sp.set('phase', phase)
    if (roomNo) sp.set('room_no', roomNo)
    if (viewType) sp.set('view_type', viewType)
    if (buyerName) sp.set('buyer_name', buyerName)
    if (reverse) sp.set('reverse_issuance', reverse)
    if (opType) sp.set('operation_type', opType)
    if (cForm) sp.set('contract_form', cForm)
    if (accType) sp.set('accommodation_type', accType)
    startTransition(() => router.push(`/contracts?${sp.toString()}`))
  }
  const reset = () => {
    setPhase(''); setRoomNo(''); setViewType(''); setBuyerName('')
    setReverse(''); setOpType(''); setCForm(''); setAccType('')
    startTransition(() => router.push('/contracts'))
  }

  // 정렬 유지를 위해 EXTENDED_COLUMNS 순서에 맞춰 visible 을 필터링.
  const orderedExt = useMemo(
    () => EXTENDED_COLUMNS.filter((c) => visibleExt.includes(c.key)),
    [visibleExt],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="차수">
            <TextInput type="number" min={1} value={phase} onChange={(e) => setPhase(e.target.value)} />
          </Field>
          <Field label="호수">
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
          </Field>
          <Field label="조망">
            <TextInput value={viewType} onChange={(e) => setViewType(e.target.value)} />
          </Field>
          <Field label="계약자명">
            <TextInput value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          </Field>
          <Field label="역발행">
            <Select value={reverse} onChange={(e) => setReverse(e.target.value)}>
              <option value="">전체</option>
              <option value="true">역발행</option>
              <option value="false">정발행</option>
            </Select>
          </Field>
          <Field label="운영방식">
            <TextInput value={opType} onChange={(e) => setOpType(e.target.value)} />
          </Field>
          <Field label="계약형태">
            <TextInput value={cForm} onChange={(e) => setCForm(e.target.value)} />
          </Field>
          <Field label="숙박형태">
            <TextInput value={accType} onChange={(e) => setAccType(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            총 <span className="font-semibold text-foreground">{rows.length}</span>건
          </div>
          <div className="flex gap-2">
            <ColumnToggle
              storageKey="contracts"
              columns={EXTENDED_COLUMNS}
              value={visibleExt}
              onChange={setVisibleExt}
            />
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 초기화
            </Button>
            <Button size="sm" onClick={apply}>
              <Search className="mr-1 h-3.5 w-3.5" /> 조회
            </Button>
            <Button size="sm" asChild>
              <Link href="/contracts/new"><Plus className="mr-1 h-3.5 w-3.5" /> 신규 등록</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일(≤sm): 카드형 목록. 기본 11필드의 핵심만 표시. 상세는 카드 클릭. */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <EmptyState description="조회된 계약이 없습니다." />
          </div>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/contracts/${r.id}`}
              className="block rounded-lg border bg-card p-3 active:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-semibold">
                    {r.phase}차 {r.room_no}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.room_type ?? ''} {r.view_type ?? ''}
                  </span>
                </div>
                <StayTypeBadge stayType={r.accommodation_type} size="sm" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>
                  <div className="text-muted-foreground">계약자</div>
                  <div className="font-medium">{r.buyer_name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">임차인</div>
                  <div className="font-medium">{r.tenant_name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">운영종료</div>
                  <div className="font-mono">{formatDate(r.operation_end) || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">임대종료</div>
                  <div className="font-mono">{formatDate(r.lease_end) || '-'}</div>
                </div>
                {r.tenant_phone && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">연락처</div>
                    <div className="font-mono">{r.tenant_phone}</div>
                  </div>
                )}
                {r.note && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">비고(민원)</div>
                    <div className="line-clamp-2">{r.note}</div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 데스크톱(≥sm): 테이블. 컬럼 토글로 추가 컬럼 표시. */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">차수</th>
              <th className="px-3 py-2 text-left">호수</th>
              <th className="px-3 py-2 text-left">타입</th>
              <th className="px-3 py-2 text-left">조망</th>
              <th className="px-3 py-2 text-left">계약자명</th>
              <th className="px-3 py-2 text-left">운영종료일</th>
              <th className="px-3 py-2 text-left">비고(민원)</th>
              <th className="px-3 py-2 text-left">숙박형태</th>
              <th className="px-3 py-2 text-left">임차인</th>
              <th className="px-3 py-2 text-left">임대종료</th>
              <th className="px-3 py-2 text-left">임차인연락처</th>
              {orderedExt.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Link href={`/contracts/${r.id}`} className="text-primary hover:underline">
                    {r.phase}차
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link href={`/contracts/${r.id}`} className="hover:underline">
                    {r.room_no}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.room_type ?? '-'}</td>
                <td className="px-3 py-2">{r.view_type ?? '-'}</td>
                <td className="px-3 py-2">{r.buyer_name ?? '-'}</td>
                <td className="px-3 py-2">{formatDate(r.operation_end)}</td>
                <td className="px-3 py-2 max-w-[14rem] truncate" title={r.note ?? ''}>
                  {r.note ?? ''}
                </td>
                <td className="px-3 py-2">
                  <StayTypeBadge stayType={r.accommodation_type} size="sm" />
                </td>
                <td className="px-3 py-2">{r.tenant_name ?? '-'}</td>
                <td className="px-3 py-2">{formatDate(r.lease_end)}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.tenant_phone ?? '-'}</td>
                {orderedExt.map((c) => (
                  <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                    {renderExt(c.key, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState description="조회된 계약이 없습니다." />
          </div>
        )}
      </div>
    </div>
  )
}
