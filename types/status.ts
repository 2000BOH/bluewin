// 객실·영선 관리 4개 페이지에서 공통으로 사용하는 상태 타입.
// supabase enum public.common_status 와 1:1 매칭된다.

export const COMMON_STATUSES = [
  '접수',
  '처리중',
  '영선반',
  '외부업체',
  '퇴실예정',
  '완료',
] as const

export type CommonStatus = (typeof COMMON_STATUSES)[number]

// 영선반 자동 연동 출처 (maintenance_requests.source 컬럼).
export const MAINTENANCE_SOURCES = [
  '직접입력',
  'room-transfer',
  'room-check',
  'room-maintenance',
] as const

export type MaintenanceSource = (typeof MAINTENANCE_SOURCES)[number]

// 긴급도.
export const URGENCY_LEVELS = ['긴급', '일반', '낮음'] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]
