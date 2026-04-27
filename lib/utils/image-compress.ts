// 클라이언트 사이드 이미지 압축 유틸 (외부 의존성 없음).
// canvas 로 리사이즈 + JPEG 재인코딩하여 Blob 으로 반환.
// EXIF 회전 정보는 브라우저가 createImageBitmap 단계에서 자동 적용 (imageOrientation: 'from-image').

export type CompressOptions = {
  maxWidth?: number   // 가로 최대 픽셀 (기본 1600)
  maxHeight?: number  // 세로 최대 픽셀 (기본 1600)
  quality?: number    // JPEG 품질 0~1 (기본 0.8)
  mimeType?: string   // 출력 MIME (기본 'image/jpeg')
}

export const compressImage = async (
  file: File,
  options: CompressOptions = {},
): Promise<Blob> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.')
  }

  // EXIF 회전 자동 적용. createImageBitmap 미지원 시 Image() 폴백.
  let bitmap: ImageBitmap | HTMLImageElement
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const srcWidth = 'width' in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth
  const srcHeight = 'height' in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1)
  const width = Math.round(srcWidth * ratio)
  const height = Math.round(srcHeight * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context 를 사용할 수 없습니다.')
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지 인코딩에 실패했습니다.'))),
      mimeType,
      quality,
    )
  })
}

// 사람이 읽기 좋은 파일 크기 포맷 (KB/MB).
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
