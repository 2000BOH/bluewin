// 공통 상태(common_status) 관련 유틸.
// - 색상/라벨 매핑
// - 상태 변경 시 자동 연동 트리거 판정 (영선/퇴실/청소)
// - 외부 페이지(객실이동/체크/정비) → 영선 페이지 자동 등록 페이로드 생성
// - 민원접수 → 접수현황 등록 페이로드 생성
//
// 실제 DB insert 는 각 페이지 액션 계층에서 수행하며, 여기서는 순수 함수만 정의한다.

import type { CommonStatus, MaintenanceSource } from '@/types/status'

// Tailwind 색상 클래스 매핑. StatusBadge 가 이 값을 사용한다.
export const STATUS_STYLE: Record<
  CommonStatus,
  { className: string; label: string; description: string }
> = {
  접수: {
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    label: '접수',
    description: '요청 접수됨 (R&R 자동 배분 대상)',
  },
  영선: {
    className:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    label: '영선',
    description: '영선반 처리 필요 (영선 페이지 자동 등록)',
  },
  외부업체: {
    className:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    label: '외부업체',
    description: '외부업체 처리 필요',
  },
  퇴실: {
    className:
      'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    label: '퇴실',
    description: '퇴실 처리 (객실체크 자동 연동)',
  },
  청소: {
    className:
      'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    label: '청소',
    description: '청소 필요 (객실정비 자동 연동, 정비유형=청소)',
  },
  완료: {
    className:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
    label: '완료',
    description: '처리 완료',
  },
}

// 상태별 자동 연동 대상 페이지.
// 외부업체/완료는 자동 연동 없음(팝업·기록만).
export const STATUS_AUTO_TARGET: Partial<
  Record<CommonStatus, '/maintenance/inbox' | '/maintenance' | '/room-check' | '/room-maintenance'>
> = {
  접수: '/maintenance/inbox',
  영선: '/maintenance',
  퇴실: '/room-check',
  청소: '/room-maintenance',
}

export const isMaintenanceTriggerStatus = (status: CommonStatus): boolean =>
  status === '영선'

export const isCleaningTriggerStatus = (status: CommonStatus): boolean =>
  status === '청소'

export const isCheckOutTriggerStatus = (status: CommonStatus): boolean =>
  status === '퇴실'

export const requiresVendorInput = (status: CommonStatus): boolean =>
  status === '외부업체'

export const isCompletionStatus = (status: CommonStatus): boolean =>
  status === '완료'

// 해당 상태가 자동 연동 대상 페이지를 가지는지 여부.
export const hasAutoTarget = (status: CommonStatus): boolean =>
  status in STATUS_AUTO_TARGET

// 영선/청소/퇴실 상태로 전환된 외부 페이지 레코드를 대상 테이블에 넣기 위한 페이로드.
export type MaintenanceAutoPayload = {
  phase: number
  room_no: string
  title: string
  content: string
  requester: string
  source: MaintenanceSource
  source_id: string
}

type AutoPayloadInput = {
  phase: number
  room_no: string
  source: Exclude<MaintenanceSource, '직접입력'>
  source_id: string
  requester: string
  summary: string
  detail?: string
}

// 출처 페이지의 컨텍스트로부터 영선/정비 요청 자동 생성 페이로드를 만든다.
// 제목 prefix 로 출처 구분이 목록에서 바로 보이도록 한다.
export const buildMaintenanceAutoPayload = (
  input: AutoPayloadInput,
): MaintenanceAutoPayload => {
  const prefixMap: Record<Exclude<MaintenanceSource, '직접입력'>, string> = {
    complaint: '[민원]',
    'room-transfer': '[객실이동]',
    'room-check': '[객실체크]',
    'room-maintenance': '[객실정비]',
  }

  return {
    phase: input.phase,
    room_no: input.room_no,
    title: `${prefixMap[input.source]} ${input.summary}`,
    content: input.detail ?? input.summary,
    requester: input.requester,
    source: input.source,
    source_id: input.source_id,
  }
}
