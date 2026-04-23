# Bluewin 통합 관리 웹앱

## 프로젝트
- 서비스: Bluewin (WINSULT 분양관리 + BLUECARE 객실/영선 관리 통합)
- 운영사: 블루오션 자산관리 (인천 영종도) / 담당: 수용 (계약관리팀)
- 대상: 블루오션 레지던스 1차~4차

## 기술 스택
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- shadcn/ui, Lucide React
- Supabase (PostgreSQL + Auth + Storage)
- React Query (TanStack Query)
- Vercel 배포, PC/모바일 반응형

## 폴더 구조
```
/app
  /(auth)/login, /dashboard
  분양관리: /room-master, /buyers, /contracts(/[id], /new, /[id]/edit),
           /consultations, /consultation-history,
           /summary/{sales,operation,expiry}, /room-status
  객실·영선: /maintenance, /room-transfer, /room-check, /room-maintenance
  공통: /history, /api
/components
  /ui (shadcn)
  /common: StatusBadge.tsx ⭐, DataTable.tsx, FilterBar.tsx, FormField.tsx
  /features: /contracts, /maintenance, /room
/lib
  /supabase: client.ts, info.ts
  /queries: DB 쿼리 함수
  /utils: history.ts, format.ts, mask.ts, status.ts(영선반 자동 연동)
/types
```

## ⭐ 공통 상태 시스템
`/components/common/StatusBadge.tsx` 로 반드시 분리.

| 상태값 | 색상 | 특수 동작 |
|---|---|---|
| 접수 | 파랑 | - |
| 처리중 | 노랑 | - |
| 영선반 | 주황 | ⭐ /maintenance 자동 등록 + 이동 안내 |
| 외부업체 | 보라 | 업체명/연락처 입력 팝업 |
| 퇴실예정 | 회색 | 퇴실 예정일 입력 |
| 완료 | 초록 | 완료일시/완료자 자동 기록 |

### 영선반 자동 연동 (`/lib/utils/status.ts`)
객실이동/체크/정비에서 상태를 "영선반"으로 변경 시:
1. `maintenance_requests` 에 레코드 자동 생성
2. `source` 에 출처 페이지, `source_id` 에 원본 ID 기록
3. "영선 페이지로 이동하시겠습니까?" 확인 → `/maintenance` 이동

---

## 🏨 객실·영선 관리 (우선 개발)

### 1. 영선 관리 (`/maintenance`)
- 필터: 차수, 호수, 상태, 긴급도, 담당자, 날짜 범위
- 목록: No, 차수, 호수, 제목, 요청자, 긴급도, 상태, 담당자, 출처, 접수일, 완료일
- 폼: 차수/호수(계약 자동완성), 제목/내용, 요청자/요청일, 긴급도(긴급/일반/낮음), 담당자, 상태(접수/처리중/완료), 처리내용, 완료일

### 2. 객실이동 (`/room-transfer`)
- 목록: No, 차수, 이동전/이동후 호수, 임차인명, 이동일, 사유, 처리자, 상태
- 폼: 이동전·이동후 차수/호수, 임차인명/연락처, 이동일, 사유, 처리자, 상태(영선반 연동), 비고

### 3. 객실체크 (`/room-check`)
- 체크리스트: 청결/비품/파손/냉난방/수도배수/전기조명/도어락/기타 (정상/불량/해당없음)
- 목록: No, 차수, 호수, 점검일, 점검자, 전체상태, 특이사항, 다음점검예정일
- 폼: 차수/호수, 점검일/점검자, 체크리스트, 특이사항, 사진(최대 5장, Storage), 다음 점검일, 상태(영선반 연동)

### 4. 객실정비 (`/room-maintenance`)
- 정비유형: 청소/수리/비품교체/도배장판/설비/기타
- 목록: No, 차수, 호수, 정비유형, 내용, 요청자, 담당자, 상태, 비용, 요청일, 완료일
- 폼: 차수/호수, 정비유형, 내용, 요청자/요청일, 담당자, 상태(영선반 연동), 비용(콤마), 완료일

---

## 📋 분양관리

### 5. 객실마스터 (`/room-master`)
- 필터: 차수/호수/타입
- 컬럼: 차수, 호수, 타입, 조망, 대지·전유·일부공용·기타공용·주차장공용 면적, 분양면적, 전유율, 테라스, 다락, 분양금액(VAT제외/포함)
- 하단 Total 합계 행, 관리자만 등록/수정

### 6. 수분양자마스터 (`/buyers`)
- 필터: 계약자번호/개인법인/계약자명/차수/호수
- 목록: 계약자번호, 개인법인, 계약자명, 계약중 호수, 계약해지 호수
- 상세: 계약자명1/2, 주민번호1/2(마스킹), 휴대폰·일반전화·이메일·주소·비고 1/2, 수신동의(문자/이메일/우편), 하단 계약 목록

### 7. 계약관리 (`/contracts`) ⭐ 핵심
- 필터: 차수, 호수, 조망, 계약자명, 역발행여부, 운영방식, 계약형태, 숙박형태
- **목록 기본 11개 컬럼만**: 차수, 호수, 타입, 조망, 계약자명, 운영종료일, 비고, 숙박형태, 임차인, 임대종료, 임차인연락처
- 상세 탭: ①계약/운영기본 ②초기비용/입주 ③금융/세금(계좌·사업자번호 일반직원 마스킹) ④임차정보 ⑤수정이력

### 8~13. 상담관리·상담내역·Summary
기존 WINSULT 화면 캡처 기준 동일 구현.

---

## 🗄️ DB 테이블

**분양관리**: `rooms`, `buyers`, `contracts`, `consultations`

**영선·객실**:
- `maintenance_requests`: id, phase, room_no, contract_id(FK?), title, content, requester, urgency, status, assigned_to, action_content, source, source_id, completed_at/by, creator/updater, created/updated_at
- `room_transfers`: id, from_phase/room_no, to_phase/room_no, tenant_name/phone, transfer_date, reason, status, note, creator/updater, timestamps
- `room_checks`: id, phase, room_no, contract_id(FK?), check_date, checker, checklist(JSON), overall_status(정상/주의/불량), special_notes, photos(JSON URL[]), next_check_date, status, creator/updater, timestamps
- `room_maintenance_tasks`: id, phase, room_no, contract_id(FK?), maintenance_type, content, requester, request_date, assigned_to, status, cost, completed_at/by, creator/updater, timestamps

**공통**:
- `change_history`: id, table_name, record_id, field_name_ko, old_value, new_value, changed_by, changed_at(KST), action(insert/update/delete)
- `users`: id, email, name, role(admin/staff/viewer), assigned_phase

---

## 🖥️ UI/UX

**사이드바**
- [분양관리] 객실마스터 · 수분양자마스터 · 계약관리 · 상담관리 · 상담내역 · 분양관리Summary · 운영숙박Summary · 계약기간 만료 객실수 · 객실현황 데이터
- [객실·영선 관리] 영선 관리 · 객실이동 · 객실체크 · 객실정비
- [공통] 수정이력

**공통 버튼**: 조회·등록·삭제·저장 (출력 화면: 인쇄·미리보기)

**모바일**: 목록 카드형, 상세 탭 유지

---

## 코딩 규칙
- 함수형 컴포넌트, camelCase / kebab-case, 주석·설명 한국어
- `any` 타입 금지
- Supabase 쿼리는 `/lib/queries` 분리
- 금액 천단위 콤마, 날짜 YYYY-MM-DD
- try-catch 필수
- 주민번호 암호화/마스킹, 계좌번호 일반직원 마스킹
- 모든 수정 시 `change_history` 자동 기록
- "영선반" 상태 변경 시 자동 연동 로직 필수

## 환경변수 (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` (필수)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (필수)
- `SUPABASE_SERVICE_ROLE_KEY` (필수)
- `NEXT_PUBLIC_APP_URL` (선택)

## 실행
`npm run dev` / `build` / `type-check` / `lint`

## Phase
1-2: 기초·Supabase·로그인·레이아웃 → 3: StatusBadge → 4-7: 영선/이동/체크/정비 → 8: 영선반 자동 연동 ⭐ → 9-13: 객실마스터/수분양자/계약 목록·상세·폼 → 14-15: 상담·객실현황 → 16-18: Summary 3종 → 19-20: 수정이력 자동기록 ⭐ · /history

## Claude 지시사항
- 코드 수정 시 전체 파일 단위로 출력
- 설명·주석 한국어
- 기능 추가 전 기존 파일 구조 먼저 파악
- 임의 파일 삭제/구조 변경 금지
- UI 심플·실무자 친화적, 모바일 반응형 필수
- StatusBadge 공통 컴포넌트 분리 필수
- "영선반" 자동 연동 로직 필수
- 계약관리 목록은 기본 11개 컬럼만
- 상세 정보는 탭 구성
- 모든 수정 시 `change_history` 자동 기록
