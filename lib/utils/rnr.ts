// R&R (Role & Responsibility) 자동 배분 유틸.
//
// 민원접수/상태변경 시 "숙박형태 → 담당자 번호" 규칙으로 자동 배분한다.
// 기본 규칙은 아래 DEFAULT_RNR_RULES 에 정의돼 있으며, 런타임에는
// public.rnr_mapping 테이블의 stay_types 배열을 먼저 조회해 오버라이드한다.
//
// 담당자 "이름" 은 번호 기반 식별 이후 rnr_mapping 에서 별도 조회해 표시한다.
// (담당자 교체 시 코드를 고치지 않고 DB 의 name 만 바꾸면 전체 반영되도록 분리.)

import type { RnrStaffNo, StayType } from '@/types/status'

export type RnrRule = {
  rnr_no: RnrStaffNo
  stay_types: StayType[]
}

// CLAUDE.md 의 초기 R&R 규칙.
// 03 인스파이어, 02 장박, 01 호텔·기숙사·퇴실·보수중, 06 영선 전담.
export const DEFAULT_RNR_RULES: RnrRule[] = [
  { rnr_no: '01', stay_types: ['호텔', '기숙사', '퇴실', '보수중'] },
  { rnr_no: '02', stay_types: ['장박_법인', '장박_개인'] },
  { rnr_no: '03', stay_types: ['인스파이어'] },
  { rnr_no: '04', stay_types: [] },
  { rnr_no: '05', stay_types: [] },
  { rnr_no: '06', stay_types: [] }, // 영선 전담 (상태=영선 전환 시)
]

// 숙박형태 기반 배분.
// 매칭되는 규칙이 여러 개면 첫 매칭을 반환. 매칭 없으면 null → UI 에서 "미배분" 표시.
export const assignRnrByStayType = (
  stayType: StayType | null | undefined,
  rules: RnrRule[] = DEFAULT_RNR_RULES,
): RnrStaffNo | null => {
  if (!stayType) return null
  const hit = rules.find((rule) => rule.stay_types.includes(stayType))
  return hit?.rnr_no ?? null
}

// 상태="영선" 으로 전환 시 영선 전담 번호(06) 반환.
export const RNR_MAINTENANCE_NO: RnrStaffNo = '06'

export const assignRnrForMaintenance = (): RnrStaffNo => RNR_MAINTENANCE_NO

// DB 의 rnr_mapping 행을 메모리 규칙 형태로 변환. (Supabase 조회 결과용)
export const toRnrRules = (
  rows: Array<{ rnr_no: RnrStaffNo; stay_types: unknown }>,
): RnrRule[] =>
  rows.map((row) => ({
    rnr_no: row.rnr_no,
    stay_types: Array.isArray(row.stay_types)
      ? (row.stay_types.filter((v): v is StayType => typeof v === 'string') as StayType[])
      : [],
  }))
