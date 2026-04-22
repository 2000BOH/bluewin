// 전체 수정이력 (/history) - Phase 20
// change_history 통합 조회. 트리거(002_change_history_triggers.sql)가 자동 기록.

import { createServerSupabase } from '@/lib/supabase/server'
import { listHistory, type HistoryFilter } from '@/lib/queries/history'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import HistoryFilters from './HistoryFilters'
import { formatDateTime } from '@/lib/utils/format'
import { labelFor, tableLabelFor } from '@/lib/utils/field-labels'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
const pickStr = (v: string | string[] | undefined): string | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null

const buildFilter = (params: SearchParams): HistoryFilter => {
  const a = pickStr(params.action)
  return {
    tableName: pickStr(params.table_name),
    action: a === 'insert' || a === 'update' || a === 'delete' ? a : null,
    from: pickStr(params.from),
    to: pickStr(params.to),
    q: pickStr(params.q),
  }
}

const renderValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const ACTION_BADGE: Record<string, string> = {
  insert: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}
const ACTION_LABEL: Record<string, string> = {
  insert: '생성',
  update: '수정',
  delete: '삭제',
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabase()
  const rows = await listHistory(supabase, buildFilter(searchParams))

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="수정이력"
        description={`전체 데이터 변경 로그 (최근 ${rows.length}건). DB 트리거에 의해 자동 기록됩니다.`}
      />
      <HistoryFilters />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">시각</th>
              <th className="px-3 py-2 text-left">테이블</th>
              <th className="px-3 py-2 text-left">동작</th>
              <th className="px-3 py-2 text-left">필드</th>
              <th className="px-3 py-2 text-left">변경전</th>
              <th className="px-3 py-2 text-left">변경후</th>
              <th className="px-3 py-2 text-left">레코드ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-t hover:bg-muted/20 align-top">
                <td className="px-3 py-2 font-mono text-xs">{formatDateTime(h.changed_at)}</td>
                <td className="px-3 py-2">{tableLabelFor(h.table_name)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      ACTION_BADGE[h.action] ?? 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ACTION_LABEL[h.action] ?? h.action}
                  </span>
                </td>
                <td className="px-3 py-2">{labelFor(h.field_name_ko)}</td>
                <td className="px-3 py-2 max-w-xs truncate text-muted-foreground" title={renderValue(h.old_value)}>
                  {renderValue(h.old_value)}
                </td>
                <td className="px-3 py-2 max-w-xs truncate" title={renderValue(h.new_value)}>
                  {renderValue(h.new_value)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {h.record_id.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="수정이력이 없습니다"
              description="002_change_history_triggers.sql 마이그레이션이 실행되지 않았거나, 아직 데이터 변경이 없는 상태입니다."
            />
          </div>
        )}
      </div>
    </div>
  )
}
