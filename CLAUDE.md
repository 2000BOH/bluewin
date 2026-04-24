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
  /complaint                      - 민원접수
  객실·영선 관리:
    /maintenance/inbox            - 접수현황
    /maintenance                  - 영선 (기존 "영선관리" 명칭 변경)
    /room-transfer, /room-check, /room-maintenance
  분양관리:
    /room-master, /buyers, /contracts(/[id], /new, /[id]/edit)
    /summary/{sales,operation,expiry}, /room-status
  R&R: /rnr/[staffNo]             - 담당자별 배분 현황 (01~06)
  /history, /api
/components
  /ui (shadcn)
  /common: StatusBadge.tsx ⭐, StayTypeBadge.tsx ⭐, DataTable.tsx,
           FilterBar.tsx, FormField.tsx, ColumnToggle.tsx ⭐
  /features: /contracts, /maintenance, /room, /rnr
/lib
  /supabase: client.ts, info.ts
  /queries: DB 쿼리 함수
  /utils: history.ts, format.ts, mask.ts, status.ts(자동 연동 로직), rnr.ts
/types
```

---

## ⭐ 공통 상태 시스템 (선택박스)
`/components/common/StatusBadge.tsx` 로 반드시 분리.

| 상태값 | 색상 | 자동 연동 | 특수 동작 |
|---|---|---|---|
| 접수 | 파랑 | → `/maintenance/inbox` (접수현황) | R&R 자동 배분 |
| 영선 | 주황 | → `/maintenance` (영선) 자동 등록 | "영선으로 이동?" 다이얼로그 |
| 외부업체 | 보라 | - | 업체명/연락처 입력 팝업 |
| 퇴실 | 회색 | → `/room-check` | 퇴실 예정일 입력 |
| 청소 | 하늘 | → `/room-maintenance` (정비유형=청소) | - |
| 완료 | 초록 | - | 완료일시/완료자 자동 기록 |

### 자동 연동 로직 (`/lib/utils/status.ts`)
상태 변경 시 해당 페이지에 레코드 자동 생성 + `source`/`source_id` 기록 + 이동 확인 다이얼로그.

---

## ⭐ 공통 숙박형태 선택박스 (`StayTypeBadge.tsx`)
`인스파이어 / 장박_법인 / 장박_개인 / 호텔 / 기숙사 / 퇴실 / 보수중 / 공실 / 입실예정 / 계약만료 / 사용금지`

---

## ⭐ R&R 자동 배분
- 담당자: `01 유태형 / 02 허아름 / 03 김동훈 / 04 사원 / 05 / 06 영선`
- **번호로 분류 후 마지막에 번호-이름 매핑** (담당자 변경 가능성)
- 민원 접수 시 **숙박형태 기준으로 담당자 자동 배분**:
  - 03(인스파이어) → 숙박형태 "인스파이어"
  - 02(장박) → "장박_법인", "장박_개인"
  - 01(호텔/단기) → "호텔", "기숙사", "퇴실", "보수중"
  - 06(영선) → 상태 "영선" 전환 시
- 배분 규칙은 `/lib/utils/rnr.ts` 에 분리, UI에서 관리자 수정 가능

---

## 🏨 객실·영선 관리

### 1. 민원접수 (`/complaint`)
- 간단한 입력 폼: 차수/호수, 민원내용, 요청자, 연락처, 숙박형태
- 저장 시 **상태=접수** 로 `maintenance_requests` 등록 → R&R 자동 배분 → `/maintenance/inbox` 노출

### 2. 접수현황 (`/maintenance/inbox`)
- 상태=접수 건만 표시 (R&R 배분 결과 + 미배분 건)
- 컬럼: No, 차수, 호수, 민원내용, 숙박형태, R&R 담당, 접수일, 상태
- 상태 변경 시 다른 페이지로 자동 연동

### 3. 영선 (`/maintenance`)
- 필터: 차수, 호수, 상태, 긴급도, 담당자(R&R), 날짜 범위
- 목록: No, 차수, 호수, 제목, 요청자, 긴급도, 상태, 담당자, 출처, 접수일, 완료일
- 폼: 차수/호수(계약 자동완성), 제목/내용, 요청자/요청일, 긴급도(긴급/일반/낮음), 담당자, 상태, 처리내용, 완료일

### 4. 객실이동 (`/room-transfer`)
- 목록: No, 차수, 이동전/이동후 호수, 임차인명, 이동일, 사유, 처리자, 상태
- 폼: 이동전·이동후 차수/호수, 임차인명/연락처, 이동일, 사유, 처리자, 상태, 비고

### 5. 객실체크 (`/room-check`)
- 체크리스트: 청결/비품/파손/냉난방/수도배수/전기조명/도어락/기타 (정상/불량/해당없음)
- 목록: No, 차수, 호수, 점검일, 점검자, 전체상태, 특이사항, 다음점검예정일
- 폼: 차수/호수, 점검일/점검자, 체크리스트, 특이사항, 사진(최대 5장, Storage), 다음 점검일, 상태

### 6. 객실정비 (`/room-maintenance`)
- 정비유형: 청소/수리/비품교체/도배장판/설비/기타
- 목록: No, 차수, 호수, 정비유형, 내용, 요청자, 담당자, 상태, 비용, 요청일, 완료일
- 폼: 차수/호수, 정비유형, 내용, 요청자/요청일, 담당자, 상태, 비용(천단위 콤마), 완료일

---

## 📋 분양관리 (상담관리·상담내역은 삭제 — PDF 주석)

### 7. 객실마스터 (`/room-master`)
- 필터: 차수/호수/타입
- 컬럼: 차수, 호수, 타입, 조망, 대지·전유·일부공용·기타공용·주차장공용 면적, 분양면적, 전유율, 테라스, 다락, 분양금액(VAT제외/포함)
- 하단 Total 합계 행, 관리자만 등록/수정

### 8. 수분양자마스터 (`/buyers`)
- 필터: 계약자번호/개인법인/계약자명/주민번호1/휴대폰1/차수/호수
- 목록: 계약자번호, 개인법인, 계약자명, 계약중 호수, 계약해지 호수, 주민번호(마스킹)
- 상세: 계약자명1/2, 주민번호1/2(마스킹), 휴대폰·일반전화·이메일·주소·비고 1/2, 수신동의(문자/이메일/우편), 하단 계약 목록

### 9. 계약관리 (`/contracts`) ⭐ 핵심

**필터**: 차수, 호수, 조망, 계약자명, 역발행여부, 운영방식, 계약형태, 숙박형태

**목록 — 기본 11개 컬럼만 표시** (나머지는 `컬럼 펼치기 ▸` 토글로 접어놓기):
> 차수 · 호수 · 타입 · 조망 · 계약자명 · 운영종료일 · **비고(민원내용)** · 숙박형태 · 임차인 · 임대종료 · 임차인연락처

**펼침 시 추가 컬럼** (`ColumnToggle.tsx` 로 사용자 선택, localStorage 저장):
분양면적, 총공급금액, 계약자번호, 개인법인, 계약상태, 계약(잔금)일, 운영시작일, 운영방식, 확정지급액, 수수료금액, 계약형태, 역발행여부, 위탁일, 렌트프리기간, 선수관리비납부, 비품비납입금, 가구공동구매입금, 숙박동의서, 선수관리예치금, 현금영수증역발행, 은행, 계좌성명, 계좌번호, 사업자등록번호, 상호, 대표자, 보증금, 임대료, 임대시작, Creator/Created/Updater/Updated

**상세 페이지 탭 구성** (WIN HBO 캡처 필드 기반):
- 탭1. **계약기본**: 계약자번호, 계약자명, 개인법인, 차수, 호수, 타입, 조망, 분양면적, 총공급금액, 계약상태, 계약(잔금)일, 계약형태, 역발행여부, 위탁일
- 탭2. **운영정보**: 운영방식, 운영시작일, 운영종료일, 확정지급액, 수수료금액, 숙박동의서, 렌트프리기간
- 탭3. **초기비용/입주**: 선수관리비납부, 비품비납입금, 가구공동구매입금, 선수관리예치금, 현금영수증역발행
- 탭4. **금융/세금** (일반직원 마스킹): 은행, 계좌성명, 계좌번호, 사업자등록번호, 상호, 대표자
- 탭5. **임차정보**: 숙박형태, 임차인, 임차인연락처, 보증금, 임대료, 임대시작, 임대종료
- 탭6. **민원/비고**: `비고` = **민원내용** (객실별 민원 이력 표시 + 신규 민원 등록 버튼 → `/complaint` 연결)
- 탭7. **수정이력**: `change_history` 조회

### 10~13. Summary·객실현황
- `/summary/sales` 분양관리Summary (운영방식·숙박형태·숙박료 집계)
- `/summary/operation` 운영숙박Summary (차수별·숙박형태별 Detail/Summary)
- `/summary/expiry` 계약기간 만료 객실수 (연도별·월별 만료 세대수)
- `/room-status` 객실현황 데이터 (WIN HBO 포맷 동일)

---

## 🗄️ DB 테이블

**분양관리**: `rooms`, `buyers`, `contracts` (상담 테이블 제거)

**영선·객실**:
- `maintenance_requests`: id, phase, room_no, contract_id(FK?), title, content, requester, urgency, **status(접수/영선/외부업체/퇴실/청소/완료)**, **stay_type(숙박형태)**, **rnr_no(01~06)**, assigned_to, action_content, source, source_id, completed_at/by, creator/updater, created/updated_at
- `room_transfers`: id, from_phase/room_no, to_phase/room_no, tenant_name/phone, transfer_date, reason, status, note, creator/updater, timestamps
- `room_checks`: id, phase, room_no, contract_id(FK?), check_date, checker, checklist(JSON), overall_status(정상/주의/불량), special_notes, photos(JSON URL[]), next_check_date, status, creator/updater, timestamps
- `room_maintenance_tasks`: id, phase, room_no, contract_id(FK?), maintenance_type, content, requester, request_date, assigned_to, status, cost, completed_at/by, creator/updater, timestamps

**공통**:
- `change_history`: id, table_name, record_id, field_name_ko, old_value, new_value, changed_by, changed_at(KST), action(insert/update/delete)
- `users`: id, email, name, role(admin/staff/viewer), assigned_phase, **rnr_no(01~06)**
- `rnr_mapping`: rnr_no, name, stay_types(JSON) — 담당자 변경 시 번호만 재매핑

---

## 🖥️ UI/UX

**사이드바**
- [민원접수] 민원접수
- [대시보드] 대시보드
- [객실·영선 관리] 접수현황 · 영선 · 객실이동 · 객실체크 · 객실정비
- [분양관리] 객실마스터 · 수분양자마스터 · 계약관리 · 분양관리Summary · 운영숙박Summary · 계약기간 만료 객실수 · 객실현황 데이터
- [R&R] 01 · 02 · 03 · 04 · 05 · 06
- [공통] 수정이력

**공통 버튼**: 조회(Retrieve·F1) · 등록(Insert·F2) · 삭제(Delete·F3) · 저장(Save·F4) · 인쇄(F5) · 미리보기(F6)

**목록 컬럼 접기**: 기본 노출 컬럼 외에는 `컬럼 펼치기 ▸` 드롭다운 체크박스로 사용자가 선택. 설정은 localStorage 저장.

**모바일**: 목록 카드형, 상세 탭 유지

---

## 코딩 규칙
- 함수형 컴포넌트, camelCase / kebab-case, 주석·설명 한국어
- `any` 타입 금지
- Supabase 쿼리는 `/lib/queries` 분리
- 금액 천단위 콤마, 날짜 YYYY-MM-DD
- try-catch 필수
- 주민번호 암호화/마스킹, 계좌번호·사업자번호 일반직원 마스킹
- 모든 수정 시 `change_history` 자동 기록
- 상태 변경 시 자동 연동 로직 필수 (접수/영선/퇴실/청소)
- 비고 필드는 **민원내용** 의미로 사용
- R&R 배분은 `/lib/utils/rnr.ts` 유틸 통해서만

## 환경변수 (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (필수)
- `NEXT_PUBLIC_APP_URL` (선택)

## 실행
`npm run dev` / `build` / `type-check` / `lint`

## Phase
1-2: 기초·Supabase·로그인·레이아웃 → 3: StatusBadge·StayTypeBadge → 4-7: 영선/이동/체크/정비 → 8: 상태 자동 연동 + R&R 배분 ⭐ → 9: 민원접수·접수현황 → 10-14: 객실마스터/수분양자/계약 목록(컬럼 토글)·상세(7탭)·폼 → 15: 객실현황 → 16-18: Summary 3종 → 19-20: 수정이력 자동기록 ⭐ · /history

## Claude 지시사항
- 코드 수정 시 전체 파일 단위로 출력
- 설명·주석 한국어
- 기능 추가 전 기존 파일 구조 먼저 파악
- 임의 파일 삭제/구조 변경 금지
- UI 심플·실무자 친화적, 모바일 반응형 필수
- StatusBadge·StayTypeBadge·ColumnToggle 공통 컴포넌트 분리 필수
- 상태 자동 연동 + R&R 배분 로직 필수
- **계약관리 목록은 기본 11개 컬럼만, 나머지는 펼침 토글**
- **상세 정보는 7개 탭 구성** (계약기본/운영정보/초기비용/금융세금/임차정보/민원비고/수정이력)
- 비고 = 민원내용
- 상담관리·상담내역은 구현하지 않음
- 모든 수정 시 `change_history` 자동 기록
