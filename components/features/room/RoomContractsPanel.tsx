'use client'

// 객실(차수+호수)별 숙박계약서 파일 패널.
// - 최신 1건만 기본 노출
// - 이전 계약서는 "이전 N건 보기" 펼치기로 확인
// - readonly=false 일 때 업로드/삭제 가능
//
// 사용처: 민원접수(컬럼 펼치기) · 객실이동(이동 전/후) · 객실정보 사이드패널.

import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import {
  uploadRoomContract,
  deleteRoomContract,
} from '@/lib/storage/room-contracts'
import {
  saveRoomContractAction,
  deleteRoomContractAction,
} from '@/app/api/room-contracts/actions'

type FileRow = {
  id: string
  file_url: string
  file_path: string
  file_name: string
  file_size: number | null
  contract_date: string | null
  guest_name: string | null
  uploaded_at: string
}

type Props = {
  phase: number | string | null | undefined
  roomNo: string | null | undefined
  // 라벨(객실이동에서 "이동 전/이동 후" 같은 prefix 가 필요할 때)
  label?: string
  readonly?: boolean
  // 컴포넌트 폭이 좁은 곳(사이드패널)용 컴팩트 모드
  compact?: boolean
}

const fmtDate = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const fmtSize = (bytes: number | null): string => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export default function RoomContractsPanel({
  phase,
  roomNo,
  label,
  readonly = false,
  compact = false,
}: Props) {
  const [rows, setRows] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const phaseNum = phase ? Number(phase) : NaN
  const valid =
    Number.isFinite(phaseNum) && phaseNum > 0 && !!roomNo && roomNo.trim().length >= 3

  const refresh = useCallback(async () => {
    if (!valid) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/room-contracts?phase=${encodeURIComponent(phaseNum)}&room_no=${encodeURIComponent(roomNo!.trim())}`,
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '조회 실패')
      setRows(Array.isArray(json.rows) ? json.rows : [])
    } catch (e) {
      setError((e as Error).message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [phaseNum, roomNo, valid])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !valid) return
    setError(null)
    setUploading(true)
    try {
      // 단건 업로드 (다건 필요시 반복 호출)
      const file = fileList[0]
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        if (!confirm('PDF 가 아닌 파일입니다. 그래도 업로드 하시겠습니까?')) {
          setUploading(false)
          return
        }
      }
      const uploaded = await uploadRoomContract(file, {
        phase: phaseNum,
        roomNo: roomNo!.trim(),
      })
      const res = await saveRoomContractAction({
        phase: phaseNum,
        roomNo: roomNo!.trim(),
        fileUrl: uploaded.publicUrl,
        filePath: uploaded.path,
        fileName: uploaded.name,
        fileSize: uploaded.size,
      })
      if ('error' in res) {
        // 메타 저장 실패 → 업로드된 파일도 정리
        try {
          await deleteRoomContract(uploaded.path)
        } catch {
          /* ignore */
        }
        throw new Error(res.error)
      }
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (row: FileRow) => {
    if (!confirm(`"${row.file_name}" 을 삭제하시겠습니까?`)) return
    setError(null)
    try {
      const res = await deleteRoomContractAction(row.id)
      if ('error' in res) throw new Error(res.error)
      // Storage 의 실제 파일도 정리
      if (res.filePath) {
        try {
          await deleteRoomContract(res.filePath)
        } catch {
          /* ignore — 메타는 이미 빠짐 */
        }
      }
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const latest = rows[0]
  const history = rows.slice(1)

  // 차수/호수 없으면 안내만
  if (!valid) {
    return (
      <div
        className={`rounded-md border border-dashed bg-muted/20 ${
          compact ? 'p-3' : 'p-4'
        } text-xs text-muted-foreground`}
      >
        {label && <div className="mb-1 font-semibold text-foreground">{label}</div>}
        차수와 호수를 입력하면 숙박계약서가 표시됩니다.
      </div>
    )
  }

  return (
    <div className={`rounded-md border bg-card ${compact ? 'p-3' : 'p-4'} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-foreground">
          {label ?? `숙박계약서 (${phaseNum}차 ${roomNo})`}
        </h4>
        {!readonly && (
          <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-input bg-background px-2 py-1 text-[11px] hover:bg-accent">
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            {uploading ? '업로드 중' : '업로드'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {loading ? (
        <p className="text-[11px] text-muted-foreground">조회 중…</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">등록된 계약서가 없습니다.</p>
      ) : (
        <>
          {/* 현재(최신) 계약서 */}
          {latest && (
            <FileLine
              row={latest}
              isLatest
              readonly={readonly}
              onDelete={() => handleDelete(latest)}
            />
          )}

          {history.length > 0 && (
            <div className="border-t pt-2">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                {showHistory ? '▲ 이전 계약서 접기' : `▼ 이전 계약서 ${history.length}건 보기`}
              </button>
              {showHistory && (
                <ul className="mt-2 space-y-1.5">
                  {history.map((row) => (
                    <li key={row.id}>
                      <FileLine
                        row={row}
                        readonly={readonly}
                        onDelete={() => handleDelete(row)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-[11px] text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function FileLine({
  row,
  isLatest = false,
  readonly,
  onDelete,
}: {
  row: FileRow
  isLatest?: boolean
  readonly: boolean
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded ${
        isLatest ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-muted/40'
      } px-2 py-1.5`}
    >
      <FileText
        className={`h-3.5 w-3.5 flex-shrink-0 ${
          isLatest ? 'text-blue-600' : 'text-muted-foreground'
        }`}
      />
      <a
        href={row.file_url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 text-xs hover:underline"
        title={row.file_name}
      >
        <span className="block truncate font-medium">{row.file_name}</span>
        <span className="block text-[10px] text-muted-foreground">
          {isLatest && <span className="mr-1 font-semibold text-blue-600">최신</span>}
          {fmtDate(row.uploaded_at)}
          {row.file_size != null && ` · ${fmtSize(row.file_size)}`}
        </span>
      </a>
      {!readonly && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
