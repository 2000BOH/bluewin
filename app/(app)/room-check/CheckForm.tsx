'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import {
  createCheckAction,
  updateCheckAction,
  type CheckFormState,
} from './actions'
import { COMMON_STATUSES } from '@/types/status'
import { CHECKLIST_ITEMS, type ChecklistMap } from '@/lib/queries/room-check'
import type { CheckRow } from '@/lib/queries/room-check'
import { compressImage, formatBytes } from '@/lib/utils/image-compress'
import { uploadRoomCheckPhoto, deleteRoomCheckPhoto } from '@/lib/storage/room-check-photos'
import { Loader2, Upload, X } from 'lucide-react'

const INITIAL: CheckFormState = {}
const ITEM_OPTS = ['정상', '불량', '해당없음'] as const
const OVERALL_OPTS = ['정상', '주의', '불량'] as const
const MAX_PHOTOS = 5

function Submit({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? '저장 중...' : label}
    </Button>
  )
}

type Props = {
  mode: 'create' | 'edit'
  initial?: CheckRow | null
  onSuccess: () => void
}

export default function CheckForm({ mode, initial, onSuccess }: Props) {
  const router = useRouter()
  const action = mode === 'create' ? createCheckAction : updateCheckAction
  const [state, formAction] = useFormState(action, INITIAL)

  // 사진은 폼 외부 상태로 관리 → 업로드 완료 URL 만 hidden input 으로 전달.
  const initialPhotos = Array.isArray(initial?.photos)
    ? (initial?.photos as unknown as string[])
    : []
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [phaseVal, setPhaseVal] = useState<string>(String(initial?.phase ?? ''))
  const [roomNoVal, setRoomNoVal] = useState<string>(initial?.room_no ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!state.ok) return
    if (state.maintenanceCreated) {
      const go = confirm('상태가 "영선"으로 변경되어 영선 페이지에 자동 등록되었습니다.\n영선 페이지로 이동할까요?')
      if (go) {
        router.push('/maintenance')
        return
      }
    }
    onSuccess()
  }, [state, onSuccess, router])

  const checklist = (initial?.checklist ?? {}) as ChecklistMap

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (!phaseVal || !roomNoVal) {
      setUploadError('차수와 호수를 먼저 입력해 주세요. (사진 저장 경로 결정용)')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const remaining = MAX_PHOTOS - photos.length
      const files = Array.from(fileList).slice(0, remaining)
      const newUrls: string[] = []
      for (const file of files) {
        const blob = await compressImage(file, { maxWidth: 1600, quality: 0.8 })
        const url = await uploadRoomCheckPhoto(blob, { phase: phaseVal, roomNo: roomNoVal })
        newUrls.push(url)
      }
      setPhotos((prev) => [...prev, ...newUrls])
    } catch (e) {
      setUploadError((e as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemove = async (idx: number) => {
    const url = photos[idx]
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    // 신규 업로드된 사진(이번 폼 세션에서 추가한 것)만 즉시 Storage 에서 삭제 시도.
    // 기존 사진은 폼 저장 후에야 DB 에서 빠지므로 여기서 지우면 영구 손실 위험 → 보존.
    if (!initialPhotos.includes(url)) {
      try {
        await deleteRoomCheckPhoto(url)
      } catch {
        // 무시: DB에서 빠지면 고아 파일이 되지만 치명적이지 않음.
      }
    }
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === 'edit' && initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      <Field label="차수" required>
        <TextInput
          name="phase"
          type="number"
          min={1}
          required
          value={phaseVal}
          onChange={(e) => setPhaseVal(e.target.value)}
        />
      </Field>
      <Field label="호수" required>
        <TextInput
          name="room_no"
          required
          value={roomNoVal}
          onChange={(e) => setRoomNoVal(e.target.value)}
        />
      </Field>
      <Field label="점검일">
        <TextInput name="check_date" type="date" defaultValue={initial?.check_date ?? ''} />
      </Field>
      <Field label="점검자">
        <TextInput name="checker" defaultValue={initial?.checker ?? ''} />
      </Field>

      <fieldset className="sm:col-span-2 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">체크리스트</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHECKLIST_ITEMS.map((it) => (
            <label key={it.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{it.label}</span>
              <select
                name={`checklist.${it.key}`}
                defaultValue={checklist[it.key] ?? '해당없음'}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {ITEM_OPTS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="전체 상태" required>
        <Select name="overall_status" defaultValue={initial?.overall_status ?? '정상'} required>
          {OVERALL_OPTS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="처리 상태" required hint="'영선' 선택 시 영선 페이지에 자동 등록">
        <Select name="status" defaultValue={initial?.status ?? '접수'} required>
          {COMMON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="특이사항" className="sm:col-span-2">
        <TextArea name="special_notes" defaultValue={initial?.special_notes ?? ''} />
      </Field>
      <Field label="다음 점검 예정일">
        <TextInput name="next_check_date" type="date" defaultValue={initial?.next_check_date ?? ''} />
      </Field>

      {/* 사진 첨부 */}
      <fieldset className="sm:col-span-2 rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          사진 첨부 ({photos.length} / {MAX_PHOTOS}) — 자동 압축 후 업로드
        </legend>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {photos.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={url} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                <img src={url} alt={`사진 ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || photos.length >= MAX_PHOTOS}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="check-photo-input"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || photos.length >= MAX_PHOTOS}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 업로드 중...</>
            ) : (
              <><Upload className="mr-1 h-3.5 w-3.5" /> 사진 추가</>
            )}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            가로 1600px / JPEG 80% 로 자동 압축됩니다 (보통 200~400KB).
          </span>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {uploadError}
          </p>
        )}
      </fieldset>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Submit label={mode === 'create' ? '등록' : '저장'} disabled={uploading} />
      </div>
    </form>
  )
}

// 압축 결과 사이즈 표기는 디버그 용도로만 export (현재 미사용).
export const _formatBytes = formatBytes
