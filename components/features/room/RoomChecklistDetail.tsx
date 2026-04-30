'use client'

// 객실체크 상세 — 카테고리별(전자제품/비품/시설상태) 항목 점검 + 조치 정보 입력.
// 사진은 기본적으로 base64 로 보관하지만, onPhotoUpload prop 이 주입되면
// 외부 스토리지(예: Supabase Storage) 에 업로드 후 URL 만 보관한다.

import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'

export type CheckCategory = 'electric' | 'amenities' | 'condition'
export type ActionType = '영선' | 'CS' | '변상' | '기타'

export interface CheckItem {
  id: string
  name: string
  category: CheckCategory
  isOk: boolean
  actionType?: ActionType
  description?: string
  photo?: string  // base64 또는 외부 URL
}

export interface CheckNotes {
  입주시특이사항?: string
  계약기간특이사항?: string
  퇴거시특이사항?: string
}

export interface ChecklistSaveResult {
  items: CheckItem[]
  notes: CheckNotes
  okCount: number
  needCount: number
  checklistJson: string
}

export interface RoomChecklistDetailProps {
  initialChecklistJson?: string | null
  initialNotes?: CheckNotes
  onSave: (result: ChecklistSaveResult) => void | Promise<void>
  // 외부 스토리지 업로더(옵션). 미지정 시 base64 로 보관.
  onPhotoUpload?: (file: File) => Promise<string>
  saving?: boolean
}

const defaultItems = {
  electric: [
    'TV', '에어컨 리모컨', 'TV 리모컨', '셋톱 리모컨', '비상손전등',
    '냉장고', '전자레인지', '세탁기', '인덕션', '후드', '에어컨',
  ],
  amenities: [
    '비누거치대', '건조대', '블라인드', '카드키', '매트리스',
    'TV장', '싱크대망', '수세미망', '접시건조대',
  ],
  condition: ['바닥 훼손', '벽지 훼손', '화장실 파손', '싱크대 파손'],
}

const categoryLabel: Record<CheckCategory, string> = {
  electric: '⚡ 전자제품',
  amenities: '🪑 비품',
  condition: '🏚️ 시설상태',
}

function buildDefaultItems(): CheckItem[] {
  const items: CheckItem[] = []
  defaultItems.electric.forEach((name, idx) =>
    items.push({ id: `el-${idx}`, name, category: 'electric', isOk: true }))
  defaultItems.amenities.forEach((name, idx) =>
    items.push({ id: `am-${idx}`, name, category: 'amenities', isOk: true }))
  defaultItems.condition.forEach((name, idx) =>
    items.push({ id: `co-${idx}`, name, category: 'condition', isOk: true }))
  return items
}

function parseInitial(json: string | null | undefined): CheckItem[] {
  if (!json) return buildDefaultItems()
  try {
    const parsed = JSON.parse(json) as CheckItem[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    // 손상되면 기본값으로 폴백
  }
  return buildDefaultItems()
}

export function RoomChecklistDetail({
  initialChecklistJson,
  initialNotes,
  onSave,
  onPhotoUpload,
  saving = false,
}: RoomChecklistDetailProps) {
  const [items, setItems] = useState<CheckItem[]>(() => parseInitial(initialChecklistJson))
  const [notes, setNotes] = useState<CheckNotes>(initialNotes ?? {})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setItems(parseInitial(initialChecklistJson))
  }, [initialChecklistJson])

  useEffect(() => {
    if (initialNotes) setNotes(initialNotes)
  }, [initialNotes])

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((it) =>
      it.id === id
        ? { ...it, isOk: !it.isOk, actionType: undefined, description: undefined }
        : it,
    ))
  }

  const setActionType = (id: string, actionType: ActionType) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, actionType } : it)))
  }

  const setDescription = (id: string, description: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, description } : it)))
  }

  const uploadPhoto = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (onPhotoUpload) {
      // 외부 스토리지 업로드 → URL 보관
      setUploadingId(id)
      try {
        const url = await onPhotoUpload(file)
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo: url } : it)))
      } catch (err) {
        setUploadError((err as Error).message)
      } finally {
        setUploadingId(null)
      }
    } else {
      // 폴백: base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo: base64 } : it)))
      }
      reader.readAsDataURL(file)
    }
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  const removePhoto = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo: undefined } : it)))
  }

  const handleSave = () => {
    const okCount = items.filter((it) => it.isOk).length
    const needCount = items.filter((it) => !it.isOk).length
    onSave({
      items,
      notes,
      okCount,
      needCount,
      checklistJson: JSON.stringify(items),
    })
  }

  const grouped: Record<CheckCategory, CheckItem[]> = {
    electric: items.filter((it) => it.category === 'electric'),
    amenities: items.filter((it) => it.category === 'amenities'),
    condition: items.filter((it) => it.category === 'condition'),
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['electric', 'amenities', 'condition'] as const).map((cat) => (
          <div key={cat} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
              <h4 className="font-bold text-sm text-gray-900">{categoryLabel[cat]}</h4>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {grouped[cat].map((item) => (
                <div
                  key={item.id}
                  className={`p-3 transition-colors ${!item.isOk ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-900">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          item.isOk ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.isOk ? '이상없음' : '조치필요'}
                      </span>
                      <label className="relative inline-block w-10 h-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!item.isOk}
                          onChange={() => toggleItem(item.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-green-500 peer-checked:bg-red-500 rounded-full transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
                      </label>
                    </div>
                  </div>

                  {!item.isOk && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-4 gap-1">
                        {(['영선', 'CS', '변상', '기타'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setActionType(item.id, type)}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                              item.actionType === type
                                ? 'bg-gray-800 text-white border-gray-800'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={item.description ?? ''}
                        onChange={(e) => setDescription(item.id, e.target.value)}
                        placeholder="상세 내용 입력"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-700">
                          {uploadingId === item.id
                            ? '업로드 중...'
                            : item.photo
                              ? '사진 변경'
                              : '사진 첨부'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadPhoto(item.id, e)}
                          className="hidden"
                          disabled={uploadingId === item.id}
                        />
                      </label>

                      {item.photo && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.photo}
                            alt="첨부사진"
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(item.id)}
                            className="absolute top-1 right-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            제거
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {uploadError && (
        <p className="text-xs text-destructive" role="alert">
          사진 업로드 실패: {uploadError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(
          [
            { key: '입주시특이사항' as const, label: '입주 시 특이사항' },
            { key: '계약기간특이사항' as const, label: '계약기간 內 특이사항' },
            { key: '퇴거시특이사항' as const, label: '퇴거 시 특이사항' },
          ]
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
            <textarea
              value={notes[key] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder="입력하세요"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingId !== null}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg shadow transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
