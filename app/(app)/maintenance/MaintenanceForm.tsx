'use client'

// 영선 요청 등록/수정 폼.
// 모달 안에 들어가 사용된다. 부모는 onClose 호출로 닫고, 성공 시 자동 새로고침(revalidatePath).

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Field, Select, TextArea, TextInput } from '@/components/common/FormField'
import {
  createMaintenanceAction,
  updateMaintenanceAction,
  type MaintenanceFormState,
} from './actions'
import { COMMON_STATUSES, URGENCY_LEVELS } from '@/types/status'
import type { MaintenanceRow } from '@/lib/queries/maintenance'
import { useRoomInput } from '@/hooks/useRoomInput'
import AutoRoomSummary from '@/components/common/AutoRoomSummary'
import { compressImage } from '@/lib/utils/image-compress'
import {
  uploadMaintenancePhoto,
  deleteMaintenancePhoto,
} from '@/lib/storage/maintenance-photos'
import { Loader2, Upload, X } from 'lucide-react'

const INITIAL: MaintenanceFormState = {}
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
  initial?: MaintenanceRow | null
  onSuccess: () => void
}

export default function MaintenanceForm({ mode, initial, onSuccess }: Props) {
  const action = mode === 'create' ? createMaintenanceAction : updateMaintenanceAction
  const [state, formAction] = useFormState(action, INITIAL)

  // 사진은 폼 외부 상태로 관리 → 업로드 완료 URL 만 hidden input 으로 전달.
  const initialPhotos = Array.isArray(initial?.photos)
    ? (initial?.photos as unknown as string[])
    : []
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const {
    phase,
    roomNo,
    roomNoRef,
    handlePhaseChange,
    handleRoomNoChange,
    handleRoomCompositionStart,
    handleRoomCompositionEnd,
  } = useRoomInput({
    initialPhase: initial?.phase != null ? String(initial.phase) : '',
    initialRoomNo: initial?.room_no ?? '',
  })

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state, onSuccess])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (!phase || !roomNo) {
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
        const url = await uploadMaintenancePhoto(blob, { phase, roomNo })
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
    // 신규 업로드분만 즉시 Storage 에서 삭제. 기존 사진은 폼 저장 후 빠지므로 보존.
    if (!initialPhotos.includes(url)) {
      try {
        await deleteMaintenancePhoto(url)
      } catch {
        // 무시: 고아 파일이 되지만 치명적이지 않음.
      }
    }
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === 'edit' && initial && (
        <input type="hidden" name="id" value={initial.id} />
      )}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      <Field label="차수" required>
        <TextInput
          name="phase"
          type="number"
          min={1}
          required
          value={phase}
          onChange={handlePhaseChange}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <Field label="호수" required>
          <TextInput
            ref={roomNoRef}
            name="room_no"
            required
            value={roomNo}
            onChange={handleRoomNoChange}
            onCompositionStart={handleRoomCompositionStart}
            onCompositionEnd={handleRoomCompositionEnd}
          />
        </Field>
      </div>

      <div className="sm:col-span-2 -mt-2 mb-2">
        <AutoRoomSummary phase={phase} roomNo={roomNo} />
      </div>

      <Field label="제목" required className="sm:col-span-2">
        <TextInput name="title" required defaultValue={initial?.title ?? ''} />
      </Field>

      <Field label="내용" className="sm:col-span-2">
        <TextArea name="content" defaultValue={initial?.content ?? ''} />
      </Field>

      <Field label="요청자">
        <TextInput name="requester" defaultValue={initial?.requester ?? ''} />
      </Field>

      <Field label="요청일">
        <TextInput name="request_date" type="date" defaultValue={initial?.request_date ?? ''} />
      </Field>

      <Field label="긴급도">
        <Select name="urgency" defaultValue={initial?.urgency ?? '일반'}>
          {URGENCY_LEVELS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="상태" required>
        <Select name="status" defaultValue={initial?.status ?? '접수'} required>
          {COMMON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="담당자" className="sm:col-span-2">
        <TextInput name="assigned_to" defaultValue={initial?.assigned_to ?? ''} />
      </Field>

      <Field label="처리내용" hint="완료 시 입력" className="sm:col-span-2">
        <TextArea name="action_content" defaultValue={initial?.action_content ?? ''} />
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
            id="maintenance-photo-input"
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
            가로 1600px / JPEG 80% 로 자동 압축됩니다.
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
