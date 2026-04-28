'use client'

// 히스토리 보기 — 최상위 3개 그룹 탭.
// 1) 객실·영선 (접수현황 / 영선 / R&R) 2) 계약관리 3) 요약(분양/숙박)

import { useState } from 'react'
import MaintenanceTabs from './tabs/MaintenanceTabs'
import ContractsSnapshotTable from './tabs/ContractsSnapshotTable'
import SummaryTabs from './tabs/SummaryTabs'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import type { ContractListItem } from '@/lib/queries/contracts'
import type { PivotTable, RentPivotTable, SalesSummaryRow } from '@/lib/queries/summary'

type Group = 'maintenance' | 'contracts' | 'summary'

type Props = {
  maintenanceRows: (MaintenanceRow & { _synthetic?: boolean })[]
  contractRows: (ContractListItem & { _synthetic?: boolean })[]
  opPivot: PivotTable
  stayPivot: PivotTable
  rentPivot: RentPivotTable
  salesByPhase: SalesSummaryRow[]
}

export default function SnapshotTabs(props: Props) {
  const [group, setGroup] = useState<Group>('maintenance')

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-2">
        <nav className="flex flex-wrap gap-1">
          {(
            [
              { k: 'maintenance', label: '객실·영선', sub: '접수현황 · 영선 · R&R' },
              { k: 'contracts', label: '계약관리', sub: '11컬럼 + 펼치기' },
              { k: 'summary', label: '요약', sub: '분양 요약 · 숙박 요약' },
            ] as const
          ).map((g) => (
            <button
              key={g.k}
              type="button"
              onClick={() => setGroup(g.k)}
              className={`flex flex-col items-start rounded-md px-4 py-2 text-sm font-medium transition ${
                group === g.k
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              <span>{g.label}</span>
              <span className={`text-[11px] font-normal ${group === g.k ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
                {g.sub}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {group === 'maintenance' && <MaintenanceTabs rows={props.maintenanceRows} />}
      {group === 'contracts' && <ContractsSnapshotTable rows={props.contractRows} />}
      {group === 'summary' && (
        <SummaryTabs
          opPivot={props.opPivot}
          stayPivot={props.stayPivot}
          rentPivot={props.rentPivot}
          salesByPhase={props.salesByPhase}
        />
      )}
    </div>
  )
}
