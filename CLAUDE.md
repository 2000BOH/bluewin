# Bluewin 통합 관리 웹앱

## 프로젝트 소개
- 서비스명: Bluewin
- 목적: WINSULT 분양관리 + BLUECARE 객실/영선 관리를 통합한 웹앱
- 운영사: 블루오션 자산관리 (인천 영종도)
- 담당자: 수용 (계약관리팀)
- 관리 대상: 블루오션 레지던스 1차 ~ 4차

## 기술 스택
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- UI 라이브러리: shadcn/ui
- 아이콘: Lucide React
- Backend: Supabase (PostgreSQL + Auth + Storage)
- 상태관리: React Query (TanStack Query)
- 배포: Vercel
- 반응형 웹앱 : PC, 모바일 

## 폴더 구조
/app
  /(auth)/login               - 로그인
  /dashboard                  - 메인 대시보드

  ## ── 분양관리 (WINSULT 이식) ──
  /room-master                - 객실마스터
  /buyers                     - 수분양자마스터
  /contracts                  - 계약관리 목록
  /contracts/[id]             - 계약관리 상세
  /contracts/new              - 계약 신규 등록
  /contracts/[id]/edit        - 계약 수정
  /consultations              - 상담관리
  /consultation-history       - 상담내역
  /summary/sales              - 분양관리Summary
  /summary/operation          - 운영숙박Summary
  /summary/expiry             - 계약기간 만료 객실수
  /room-status                - 객실현황 데이터

  ## ── 객실·영선 관리 (BLUECARE 이식) ──
  /maintenance                - 영선 관리
  /room-transfer              - 객실이동 관리
  /room-check                 - 객실체크 관리
  /room-maintenance           - 객실정비 관리

  ## ── 공통 ──
  /history                    - 전체 수정 이력 (신규)
  /api                        - API 라우트

/components
  /ui                         - shadcn 컴포넌트
  /common
    StatusBadge.tsx           - ⭐ 공통 상태 배지 컴포넌트 (6가지 상태)
    DataTable.tsx             - 공통 테이블
    FilterBar.tsx             - 공통 필터 바
    FormField.tsx             - 공통 폼 필드
  /features
    /contracts                - 계약관리 관련 컴포넌트
    /maintenance              - 영선 관련 컴포넌트
    /room                     - 객실 관련 컴포넌트

/lib
  /supabase                   - Supabase 클라이언트 (client.ts, info.ts)
  /queries                    - DB 쿼리 함수 모음
  /utils
    history.ts                - 수정이력 자동 기록 유틸
    format.ts                 - 날짜/금액 포맷 유틸
    mask.ts                   - 개인정보 마스킹 유틸
    status.ts                 - 상태 변환/연동 유틸 (영선반 자동 연동 포함)

/types                        - TypeScript 타입 정의

## =============================================
## 🏨 객실·영선 관리 기능 명세 (BLUECARE 이식) - 우선 개발
## =============================================

## ⭐ 공통 상태 시스템 (4개 페이지 모두 사용)
모든 객실·영선 페이지에서 공통으로 사용하는 상태값.
/components/common/StatusBadge.tsx 로 반드시 분리할 것.

| 상태값   | 배지 색상 | 설명               | 특수 동작                              |
|----------|-----------|--------------------|-----------------------------------------|
| 접수     | 파란색    | 요청 접수됨        | 없음                                    |
| 처리중   | 노란색    | 처리 진행 중       | 없음                                    |
| 영선반   | 주황색    | 영선반 처리 필요   | ⭐ /maintenance 에 자동 등록 + 이동 안내 |
| 외부업체 | 보라색    | 외부업체 처리 필요 | 업체명/연락처 입력 팝업                 |
| 퇴실예정 | 회색      | 퇴실 후 처리 예정  | 퇴실 예정일 입력                        |
| 완료     | 초록색    | 처리 완료          | 완료일시/완료자 자동 기록               |

### 영선반 자동 연동 로직 (/lib/utils/status.ts)
- 객실이동/객실체크/객실정비 페이지에서 상태를 "영선반"으로 변경 시:
  1. maintenance_requests 테이블에 새 레코드 자동 생성
  2. source 필드에 출처 페이지 기록 (room-transfer/room-check/room-maintenance)
  3. source_id 필드에 원본 레코드 ID 기록
  4. "영선 페이지로 이동하시겠습니까?" 확인 다이얼로그 표시
  5. 확인 클릭 시 /maintenance 페이지로 이동

---

### 1. 영선 관리 (/maintenance)
BLUECARE MaintenancePage 기반.
다른 페이지에서 "영선반" 상태 선택 시 자동으로 이 페이지에 요청이 등록됨.

#### 목록 필터
차수, 호수, 상태, 긴급도, 담당자, 날짜 범위

#### 목록 컬럼
No, 차수, 호수, 제목, 요청자, 긴급도, 상태, 담당자, 출처, 접수일, 완료일

#### 등록/수정 폼 필드
- 차수, 호수 (계약 데이터 연동 자동완성)
- 제목, 내용
- 요청자, 요청일
- 긴급도 (긴급/일반/낮음)
- 담당자 (직원 선택 드롭다운)
- 상태 (접수/처리중/완료)
- 처리내용 (완료 시 입력)
- 완료일

---

### 2. 객실이동 (/room-transfer)
BLUECARE RoomTransferPage 기반.

#### 목록 컬럼
No, 차수, 이동전 호수, 이동후 호수, 임차인명, 이동일, 사유, 처리자, 상태

#### 등록/수정 폼 필드
- 이동전 차수/호수
- 이동후 차수/호수
- 임차인명, 임차인연락처
- 이동일, 이동사유
- 처리자
- 상태 (접수/처리중/영선반/외부업체/퇴실예정/완료) ← 영선반 선택 시 자동 연동
- 비고

---

### 3. 객실체크 (/room-check)
BLUECARE RoomCheckPage 기반.

#### 체크리스트 항목 (항목별 정상/불량/해당없음)
청결 상태, 비품 유무, 파손 여부, 에어컨/냉난방, 수도/배수, 전기/조명, 도어락, 기타

#### 목록 컬럼
No, 차수, 호수, 점검일, 점검자, 전체상태, 특이사항, 다음점검예정일

#### 등록/수정 폼 필드
- 차수, 호수
- 점검일, 점검자
- 체크리스트 항목별 상태
- 특이사항
- 사진 첨부 (최대 5장, Supabase Storage)
- 다음 점검 예정일
- 상태 (접수/처리중/영선반/외부업체/퇴실예정/완료) ← 영선반 선택 시 자동 연동

---

### 4. 객실정비 (/room-maintenance)
BLUECARE RoomMaintenancePage 기반.

#### 정비 유형
청소, 수리, 비품교체, 도배/장판, 설비, 기타

#### 목록 컬럼
No, 차수, 호수, 정비유형, 내용, 요청자, 담당자, 상태, 비용, 요청일, 완료일

#### 등록/수정 폼 필드
- 차수, 호수
- 정비유형
- 정비내용
- 요청자, 요청일
- 담당자 (직원 또는 외부업체명)
- 상태 (접수/처리중/영선반/외부업체/퇴실예정/완료) ← 영선반 선택 시 자동 연동
- 비용 (천단위 콤마)
- 완료일

---

## =============================================
## 📋 분양관리 기능 명세 (WINSULT 이식)
## =============================================

### 5. 객실마스터 (/room-master)
필터: 차수, 호수, 타입
목록 컬럼: No, 차수, 호수, 타입, 조망, 대지면적, 전유면적,
일부공용, 기타공용, 주차장공용, 분양면적, 전유율,
테라스, 다락, 분양금액(VAT제외), 분양금액(VAT포함)
기능: 조회/등록/수정/저장, 하단 Total 합계 행, 관리자만 등록/수정

### 6. 수분양자마스터 (/buyers)
필터: 계약자번호, 개인/법인, 계약자명, 차수, 호수
목록: No, 계약자번호, 개인/법인, 계약자명, 계약중 호수, 계약해지 호수
상세: 계약자명1/2, 주민번호1/2(마스킹), 휴대폰1/2, 일반전화1/2,
이메일1/2, 주소1/2, 비고1/2, 수신동의(문자/이메일/우편)
하단: 해당 계약자의 계약 목록 연결

### 7. 계약관리 (/contracts) ⭐ 핵심
필터: 차수, 호수, 조망, 계약자명, 역발행여부, 운영방식, 계약형태, 숙박형태
목록 기본 11개 컬럼만 표시:
차수, 호수, 타입, 조망, 계약자명, 운영종료일, 비고, 숙박형태, 임차인, 임대종료, 임차인연락처

상세 탭:
탭1. 계약/운영기본
탭2. 초기비용/입주
탭3. 금융/세금 (계좌번호/사업자번호 일반직원 마스킹)
탭4. 임차정보
탭5. 수정이력

### 8~13. 상담관리, 상담내역, Summary 페이지들
(기존 WINSULT 화면 캡처 기준 동일하게 구현)

---

## =============================================
## 🗄️ 데이터베이스 테이블
## =============================================

### 분양관리 테이블
- rooms: 객실마스터 (phase, room_no, type, view_type, 면적들, 금액들)
- buyers: 수분양자 (buyer_no, buyer_type, 이름, 주민번호암호화, 연락처들, 주소들, 수신동의)
- contracts: 계약관리 (전체 계약 필드 - 이전 CLAUDE.md 참고)
- consultations: 상담관리

### 객실·영선 관리 테이블

#### maintenance_requests (영선 요청)
- id, phase, room_no, contract_id(FK 선택)
- title, content, requester, urgency(긴급/일반/낮음)
- status(접수/처리중/영선반/외부업체/퇴실예정/완료)
- assigned_to, action_content
- source(직접입력/room-transfer/room-check/room-maintenance)
- source_id
- completed_at, completed_by
- creator, updater, created_at, updated_at

#### room_transfers (객실이동)
- id, from_phase, from_room_no, to_phase, to_room_no
- tenant_name, tenant_phone, transfer_date, reason
- status(접수/처리중/영선반/외부업체/퇴실예정/완료)
- note, creator, updater, created_at, updated_at

#### room_checks (객실체크)
- id, phase, room_no, contract_id(FK 선택)
- check_date, checker
- checklist(JSON - 항목별 정상/불량/해당없음)
- overall_status(정상/주의/불량)
- special_notes
- photos(JSON - Supabase Storage URL 배열)
- next_check_date
- status(접수/처리중/영선반/외부업체/퇴실예정/완료)
- creator, updater, created_at, updated_at

#### room_maintenance_tasks (객실정비)
- id, phase, room_no, contract_id(FK 선택)
- maintenance_type(청소/수리/비품교체/도배장판/설비/기타)
- content, requester, request_date, assigned_to
- status(접수/처리중/영선반/외부업체/퇴실예정/완료)
- cost
- completed_at, completed_by
- creator, updater, created_at, updated_at

#### change_history (전체 수정이력)
- id, table_name, record_id
- field_name_ko(한국어 필드명)
- old_value, new_value
- changed_by, changed_at(KST)
- action(insert/update/delete)

#### users (직원)
- id, email, name
- role(admin/staff/viewer)
- assigned_phase(담당 차수)

---

## =============================================
## 🖥️ UI/UX 공통 정책
## =============================================

## 사이드바 메뉴 구성
[분양관리]
- 객실마스터
- 수분양자마스터
- 계약관리
- 상담관리
- 상담내역
- 분양관리Summary
- 운영숙박Summary
- 계약기간 만료 객실수
- 객실현황 데이터

[객실·영선 관리]
- 영선 관리
- 객실이동
- 객실체크
- 객실정비

[공통]
- 수정이력

## 공통 버튼
조회(Retrieve), 등록(Insert), 삭제(Delete), 저장(Save)
출력 화면: 인쇄(Print), 미리보기(Preview) 추가

## 모바일 대응
목록: 카드형 레이아웃, 상세: 탭 유지

---

## 코딩 규칙
- 컴포넌트 함수형, camelCase, kebab-case, 한국어 주석
- any 타입 금지
- Supabase 쿼리 /lib/queries 분리
- 금액 천단위 콤마, 날짜 YYYY-MM-DD
- try-catch 필수
- 주민번호 암호화/마스킹, 계좌번호 일반직원 마스킹
- 모든 수정 시 change_history 자동 기록
- 상태 "영선반" 변경 시 자동 연동 로직 반드시 적용

## 환경변수 (.env.local)
【필수입력 ①】 NEXT_PUBLIC_SUPABASE_URL=← Supabase 프로젝트 URL
【필수입력 ②】 NEXT_PUBLIC_SUPABASE_ANON_KEY=← Supabase anon key
【필수입력 ③】 SUPABASE_SERVICE_ROLE_KEY=← Supabase service role key
【선택입력 ④】 NEXT_PUBLIC_APP_URL=← 배포 후 앱 URL

## 실행 명령어
- npm run dev / npm run build / npm run type-check / npm run lint

## 개발 우선순위 (Phase)
Phase 1:  프로젝트 기초 + Supabase 전체 테이블 생성
Phase 2:  로그인 / 권한 / 공통 레이아웃 + 사이드바
Phase 3:  공통 상태 시스템 + StatusBadge 컴포넌트
Phase 4:  영선 관리 (/maintenance)
Phase 5:  객실이동 (/room-transfer)
Phase 6:  객실체크 (/room-check)
Phase 7:  객실정비 (/room-maintenance)
Phase 8:  영선반 상태 → 영선 페이지 자동 연동 ⭐
Phase 9:  객실마스터 (/room-master)
Phase 10: 수분양자마스터 (/buyers)
Phase 11: 계약관리 목록 (/contracts)
Phase 12: 계약관리 상세 (/contracts/[id])
Phase 13: 계약관리 등록/수정 폼
Phase 14: 상담관리 (/consultations)
Phase 15: 객실현황 데이터 (/room-status)
Phase 16: 운영숙박Summary
Phase 17: 계약기간 만료 객실수
Phase 18: 분양관리Summary
Phase 19: 수정 히스토리 자동 기록 시스템 ⭐
Phase 20: 수정이력 전체 조회 (/history)

## Claude에게 지시사항
- 코드 수정 시 반드시 전체 파일 단위로 출력
- 설명과 주석은 한국어
- 기능 추가 전 기존 파일 구조 파악 먼저
- 임의로 파일 삭제/구조 변경 금지
- UI는 심플하고 실무자 친화적으로
- 모바일 반응형 필수
- StatusBadge는 반드시 공통 컴포넌트로 분리
- 영선반 상태 선택 시 자동 연동 로직 반드시 구현
- 계약관리 목록은 기본 11개 컬럼만 표시
- 상세 정보는 그룹별 탭으로 구성
- 모든 수정 시 change_history 자동 기록