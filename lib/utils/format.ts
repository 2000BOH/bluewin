// 표시용 포맷 유틸. 날짜는 YYYY-MM-DD, 금액은 천단위 콤마.

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const date = formatDate(d)
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${hh}:${mi}`
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return value.toLocaleString('ko-KR')
}

export const parseNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null
  const cleaned = String(value).replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isNaN(n) ? null : n
}

// 오늘 날짜 (KST 기준 YYYY-MM-DD)
export const todayKst = (): string => {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  return formatDate(new Date(now.getTime() + offset))
}
