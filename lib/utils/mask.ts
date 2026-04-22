// 개인정보/금융정보 마스킹 유틸. 일반직원(staff/viewer) 에게는 일부만 노출.

export const maskSsn = (decrypted: string | null | undefined): string => {
  if (!decrypted) return ''
  // 6자리-7자리 (예: 901225-1234567) 형식 가정. 뒷자리 1자만 노출.
  const cleaned = decrypted.replace(/-/g, '')
  if (cleaned.length < 7) return '*'.repeat(cleaned.length)
  return `${cleaned.slice(0, 6)}-${cleaned[6]}******`
}

export const maskAccountNo = (value: string | null | undefined): string => {
  if (!value) return ''
  const cleaned = value.replace(/\s/g, '')
  if (cleaned.length <= 4) return '*'.repeat(cleaned.length)
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`
}

export const maskBusinessNo = (value: string | null | undefined): string => {
  if (!value) return ''
  // 사업자번호: 3-2-5
  const cleaned = value.replace(/-/g, '')
  if (cleaned.length < 10) return '*'.repeat(cleaned.length)
  return `${cleaned.slice(0, 3)}-**-*****`
}

export const maskPhone = (value: string | null | undefined): string => {
  if (!value) return ''
  const cleaned = value.replace(/-/g, '')
  if (cleaned.length < 8) return value
  return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`
}

// admin 권한 여부에 따라 마스킹/원본 분기.
export const maskByRole = <T extends string | null | undefined>(
  value: T,
  isAdmin: boolean,
  masker: (v: T) => string,
): string => (isAdmin ? (value ?? '') : masker(value))
