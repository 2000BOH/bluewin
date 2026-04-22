// 공통 상태(common_status) 관련 유틸.
// - 색상/라벨 매핑
// - 영선반 자동 연동 트리거 판정
// - 외부 페이지(객실이동/객실체크/객실정비) → 영선 페이지 자동 등록 페이로드 생성
//
// 실제 DB insert 는 Phase 8 에서 구현하며, 여기서는 "필요한 페이로드" 를 만드는 순수 함수만 정의한다.

import type { CommonStatus, MaintenanceSource } from '@/types/status'

// Tailwind 색상 클래스 매핑. StatusBadge 는 이 값을 사용해 배지를 그린다.
// 배경/텍스트/테두리 모두 라이트/다크 양쪽에서 가독성을 확보하도록 지정.
export const STATUS_STYLE: Record<
  CommonStatus,
  { className: string; label: string; description: string }
> = {
  접수: {
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    label: '접수',
    description: '요청 접수됨',
  },
  처리중: {
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900',
    label: '처리중',
    description: '처리 진행 중',
  },
  영선반: {
    className:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    label: '영선반',
    description: '영선반 처리 필요 (자동 연동)',
  },
  외부업체: {
    className:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    label: '외부업체',
    description: '외부업체 처리 필요',
  },
  퇴실예정: {
    className:
      'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    label: '퇴실예정',
    description: '퇴실 후 처리 예정',
  },
  완료: {
    className:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
    label: '완료',
    description: '처리 완료',
  },
}

// "영선반" 상태로 변경됐을 때 maintenance_requests 자동 생성을 트리거할지 판정.
export const isMaintenanceTriggerStatus = (status: CommonStatus): boolean =>
  status === '영선반'

// 외부업체 선택 시 업체 정보 입력 팝업이 필요한지 판정.
export const requiresVendorInput = (status: CommonStatus): boolean =>
  status === '외부업체'

// 퇴실예정 선택 시 퇴실 예정일 입력이 필요한지 판정.
export const requiresMoveOutDate = (status: CommonStatus): boolean =>
  status === '퇴실예정'

// 완료 상태 진입 시 completed_at / completed_by 자동 채움이 필요한지 판정.
export const isCompletionStatus = (status: CommonStatus): boolean =>
  status === '완료'

// "영선반" 상태로 전환된 외부 페이지 레코드를 maintenance_requests 한 줄로 변환하기 위한
// 입력 페이로드. Phase 8 에서 이 페이로드를 받아 실제 insert + 페이지 이동 다이얼로그를 띄운다.
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
  // 출처 페이지에서 전달하는 요약 (제목/본문 변환용).
  summary: string
  detail?: string
}

// 출처 페이지의 컨텍스트를 받아 영선 요청 자동 생성 페이로드를 만든다.
// 비즈니스 정책상 제목 prefix 를 출처별로 다르게 둬서, 영선 페이지 목록에서 어디서 넘어왔는지 한눈에 보이게 한다.
export const buildMaintenanceAutoPayload = (
  input: AutoPayloadInput,
): MaintenanceAutoPayload => {
  const prefixMap: Record<Exclude<MaintenanceSource, '직접입력'>, string> = {
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
