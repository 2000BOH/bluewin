'use client'

// 목록 표 안에 사진을 작게 노출하는 컴포넌트.
// - 기본: 최대 3장의 썸네일 inline
// - 4장 이상: "+N" 버튼으로 펼치기
// - 호버: 큰 미리보기를 커서 옆에 floating 표시 (portal)
// - 클릭: 새 탭에서 원본 열기
//
// 사용처: 영선(MaintenanceTable) · 객실체크(CheckTable) 의 "사진" 컬럼.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageOff } from 'lucide-react'

type Props = {
  photos: string[] | null | undefined
  maxThumbnails?: number
  thumbSize?: number  // px
}

const PREVIEW_SIZE = 320  // 호버 미리보기 한 변 크기
const PREVIEW_OFFSET = 16

export default function PhotoStrip({
  photos,
  maxThumbnails = 3,
  thumbSize = 32,
}: Props) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : []
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState<{ url: string; x: number; y: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (list.length === 0) {
    return (
      <span className="inline-flex items-center text-muted-foreground" aria-label="사진 없음">
        <ImageOff className="h-3.5 w-3.5 opacity-40" />
      </span>
    )
  }

  const visible = expanded ? list : list.slice(0, maxThumbnails)
  const hiddenCount = list.length - visible.length

  const handleMouseEnter = (url: string, e: React.MouseEvent) => {
    setHover({ url, x: e.clientX, y: e.clientY })
  }
  const handleMouseMove = (url: string, e: React.MouseEvent) => {
    setHover({ url, x: e.clientX, y: e.clientY })
  }
  const handleMouseLeave = () => setHover(null)

  // 화면 밖으로 넘치지 않도록 위치 보정.
  const previewStyle: React.CSSProperties | null = hover
    ? (() => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
        const vh = typeof window !== 'undefined' ? window.innerHeight : 768
        let left = hover.x + PREVIEW_OFFSET
        let top = hover.y + PREVIEW_OFFSET
        if (left + PREVIEW_SIZE > vw) left = hover.x - PREVIEW_SIZE - PREVIEW_OFFSET
        if (top + PREVIEW_SIZE > vh) top = hover.y - PREVIEW_SIZE - PREVIEW_OFFSET
        if (left < 0) left = 0
        if (top < 0) top = 0
        return { position: 'fixed', left, top, zIndex: 9999, pointerEvents: 'none' }
      })()
    : null

  return (
    <div className="inline-flex items-center gap-1">
      {visible.map((url, idx) => (
        <a
          key={`${url}-${idx}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={(e) => handleMouseEnter(url, e)}
          onMouseMove={(e) => handleMouseMove(url, e)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
          className="block overflow-hidden rounded border border-border/60 bg-muted transition hover:ring-2 hover:ring-primary/40"
          style={{ width: thumbSize, height: thumbSize }}
          aria-label={`사진 ${idx + 1} (확대)`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`사진 ${idx + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </a>
      ))}

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(true)
          }}
          className="inline-flex items-center justify-center rounded border border-border/60 bg-muted/40 px-1.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          style={{ height: thumbSize, minWidth: thumbSize }}
          title={`나머지 ${hiddenCount}장 펼치기`}
        >
          +{hiddenCount}
        </button>
      )}

      {expanded && list.length > maxThumbnails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(false)
          }}
          className="ml-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          title="접기"
        >
          접기
        </button>
      )}

      {mounted &&
        hover &&
        previewStyle &&
        createPortal(
          <div style={previewStyle} className="rounded-lg border bg-card shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hover.url}
              alt="미리보기"
              className="rounded-lg object-contain"
              style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
