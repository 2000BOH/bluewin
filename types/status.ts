// 객실·영선 관리 공통 상태 타입.
// supabase enum public.common_status 와 1:1 매칭된다.
// 2026-04 개편: "처리중/영선반/퇴실예정" 제거, "영선/퇴실/청소" 도입.
//   - 처리중 → 접수로 통합
//   - 영선반 → 영선 (명칭 단순화)
//   - 퇴실예정 → 퇴실
//   - 청소: 객실정비(정비유형=청소) 자동 연동용 신규 상태

export const COMMON_STATUSES = [
  '접수',
  '영선',
  '외부업체',
  '퇴실',
  '청소',
  '완료',
] as const

export type CommonStatus = (typeof COMMON_STATUSES)[number]

// 영선·객실이동·객실체크·객실정비·민원접수 레코드의 출처 추적.
export const MAINTENANCE_SOURCES = [
  '직접입력',
  'complaint',
  'room-transfer',
  'room-check',
  'room-maintenance',
] as const

export type MaintenanceSource = (typeof MAINTENANCE_SOURCES)[number]

// 객실·영선 관리 소제목(출처) 한글 라벨 매핑 (필터용)
export const SOURCE_LABELS: Record<MaintenanceSource, string> = {
  '직접입력': '영선 (직접입력)',
  'complaint': '민원접수',
  'room-transfer': '객실이동',
  'room-check': '객실체크',
  'room-maintenance': '객실정비',
}

// 긴급도.
export const URGENCY_LEVELS = ['긴급', '일반', '낮음'] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]

// 공통 숙박형태 (분양관리 계약의 accommodation_type, 민원/R&R 배분 근거).
export const STAY_TYPES = [
  '인스파이어',
  '장박_법인',
  '장박_개인',
  '호텔',
  '기숙사',
  '퇴실',
  '보수중',
  '공실',
  '입실예정',
  '계약만료',
  '사용금지',
] as const

export type StayType = (typeof STAY_TYPES)[number]

// R&R 담당자 번호 목록.
export const RNR_STAFF_NOS = ['01', '02', '03', '04', '05', '06'] as const
export type RnrStaffNo = (typeof RNR_STAFF_NOS)[number]

// ★ R&R 담당자 이름 — 단일 진실의 원천 (Single Source of Truth) ★
// 사이드바·R&R 상세 헤더·접수현황 필터·대시보드 위젯이 모두 이 값을 참조합니다.
// 담당자 변경 시 여기만 수정하면 전체 화면에 즉시 반영됩니다.
// 값이 빈 문자열('')이면 해당 번호는 화면·사이드바에서 숨김 처리됩니다.
// 민원 접수자 목록 — 민원접수 폼과 필터바 공용
export const ACCEPTORS = ['태형', '아름', '동훈', '민수', '남식', '수용', '기타'] as const
export type Acceptor = (typeof ACCEPTORS)[number]

export const RNR_STAFF_MAPPING: Record<RnrStaffNo, string> = {
  '01': '유태형 과장',
  '02': '허아름 대리',
  '03': '김동훈 대리',
  '04': '',            // 미배정 (숨김)
  '05': '강민수 사원',
  '06': '영선반',
}
