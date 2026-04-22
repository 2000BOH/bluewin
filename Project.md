# Bluewin 통합 관리 프로젝트 구성안

## 프로젝트 목표
1. BLUECARE (React/Vite) 의 객실·영선 관리 기능을 Next.js로 이식
2. WINSULT 분양관리 기능을 웹앱으로 이식
3. 두 기능을 Bluewin 하나로 통합
4. 수정 히스토리 추적 기능 추가

---

## 전체 메뉴 구성

### 객실·영선 관리 (BLUECARE 이식)
| 메뉴 | 경로 | 설명 |
|------|------|------|
| 영선 관리 | /maintenance | 영선 요청 등록/처리 ⭐ |
| 객실이동 | /room-transfer | 임차인 이동 관리 |
| 객실체크 | /room-check | 객실 점검 체크리스트 |
| 객실정비 | /room-maintenance | 정비 요청 및 비용 관리 |

### 분양관리 (WINSULT 이식)
| 메뉴 | 경로 | 설명 |
|------|------|------|
| 객실마스터 | /room-master | 호실별 면적/금액 |
| 수분양자마스터 | /buyers | 계약자 정보 |
| 계약관리 | /contracts | 핵심 계약 데이터 ⭐ |
| 상담관리 | /consultations | 계약자 상담 |
| 상담내역 | /consultation-history | 상담 이력 출력 |
| 분양관리Summary | /summary/sales | 분양 현황 출력 |
| 운영숙박Summary | /summary/operation | 숙박형태별 집계 |
| 계약기간 만료 객실수 | /summary/expiry | 월별 만료 현황 |
| 객실현황 데이터 | /room-status | 운영 현황 목록 |

### 공통
| 메뉴 | 경로 | 설명 |
|------|------|------|
| 수정이력 | /history | 전체 변경 이력 ⭐ |

---

## ⭐ 핵심: 공통 상태 시스템

4개 페이지(영선/객실이동/객실체크/객실정비) 모두 같은 상태값 사용

```
접수 (파란색) → 처리중 (노란색) → [영선반/외부업체/퇴실예정] → 완료 (초록색)
                                         ↓
                                   영선반 선택 시
                                   /maintenance 에
                                   자동으로 등록됨!
```

---

## 개발 단계 (Phase)

| Phase | 내용 | 분류 | 상태 |
|-------|------|------|------|
| 1 | 프로젝트 기초 + 전체 테이블 생성 | 기초 | ⬜ |
| 2 | 로그인 + 권한 + 레이아웃 + 사이드바 | 기초 | ⬜ |
| 3 | 공통 상태 시스템 + StatusBadge | 객실·영선 | ⬜ |
| 4 | 영선 관리 | 객실·영선 | ⬜ |
| 5 | 객실이동 | 객실·영선 | ⬜ |
| 6 | 객실체크 | 객실·영선 | ⬜ |
| 7 | 객실정비 | 객실·영선 | ⬜ |
| 8 | 영선반 → 영선 자동 연동 ⭐ | 객실·영선 | ⬜ |
| 9 | 객실마스터 | 분양관리 | ⬜ |
| 10 | 수분양자마스터 | 분양관리 | ⬜ |
| 11 | 계약관리 목록 | 분양관리 | ⬜ |
| 12 | 계약관리 상세 페이지 | 분양관리 | ⬜ |
| 13 | 계약관리 등록/수정 폼 | 분양관리 | ⬜ |
| 14 | 상담관리 | 분양관리 | ⬜ |
| 15 | 객실현황 데이터 | 분양관리 | ⬜ |
| 16 | 운영숙박Summary | Summary | ⬜ |
| 17 | 계약기간 만료 객실수 | Summary | ⬜ |
| 18 | 분양관리Summary | Summary | ⬜ |
| 19 | 수정 히스토리 시스템 ⭐ | 공통 | ⬜ |
| 20 | 수정이력 전체 조회 | 공통 | ⬜ |

※ 완료 시 ⬜ → ✅ 변경하여 진행 관리

---

## 완료 기준
- [ ] Phase 1~2: 기본 뼈대 + 로그인 완성
- [ ] Phase 3~8: 객실·영선 관리 완성 → BLUECARE 대체 가능
- [ ] Phase 9~13: 계약관리 완성 → WINSULT 핵심 대체 가능
- [ ] Phase 14~18: 상담/Summary 완성 → WINSULT 전체 대체 가능
- [ ] Phase 19~20: 히스토리 완성 → 전체 완성 🎉

---

## Phase별 Claude Code 명령어

### Phase 1 (복붙용)
```
CLAUDE.md 파일을 읽고 내용을 파악한 다음 Phase 1을 진행해줘.

조건:
- Next.js 14 App Router + TypeScript + Tailwind CSS 세팅
- shadcn/ui, Lucide React, React Query 설치
- CLAUDE.md의 폴더 구조대로 디렉토리 생성
- Supabase 클라이언트 /lib/supabase/client.ts, /lib/supabase/info.ts 생성
- .env.local.example 파일 생성
- /supabase/migrations/001_init.sql 파일에 전체 테이블 SQL 작성
  (rooms, buyers, contracts, consultations,
   maintenance_requests, room_transfers, room_checks, room_maintenance_tasks,
   change_history, users)
  RLS 정책 및 updated_at 자동 트리거 포함
```

### Phase 2 (복붙용)
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase 2를 진행해줘.

조건:
- Supabase Auth 이메일+비밀번호 로그인
- /app/(auth)/login 페이지
- 로그인 후 /dashboard 이동, 미로그인 시 /login 리다이렉트
- 권한(admin/staff/viewer) 체크 미들웨어
- 좌측 사이드바 + 상단 헤더 공통 레이아웃
- 사이드바 메뉴: CLAUDE.md의 2개 그룹 구조 기준
  (분양관리 그룹 / 객실·영선 관리 그룹 / 공통)
- 로그아웃 버튼, 모바일 반응형 적용
```

### Phase 3 (복붙용)
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase 3을 진행해줘.

조건:
- /components/common/StatusBadge.tsx 생성
  6가지 상태값: 접수(파란색)/처리중(노란색)/영선반(주황색)/외부업체(보라색)/퇴실예정(회색)/완료(초록색)
- /lib/utils/status.ts 생성
  영선반 자동 연동 함수 포함:
  handleStatusChange(status, sourceTable, sourceId, phaseNo, roomNo) 함수
  → 상태가 "영선반"일 때 maintenance_requests에 자동 insert
  → "영선 페이지로 이동하시겠습니까?" 다이얼로그 반환
- StatusBadge는 상태 선택 드롭다운 기능도 포함
```

### Phase 4 (복붙용)
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase 4를 진행해줘.

조건:
- /app/maintenance 페이지 (영선 관리)
- 목록 필터: 차수, 호수, 상태, 긴급도, 담당자, 날짜 범위
- 목록 컬럼: No, 차수, 호수, 제목, 요청자, 긴급도, 상태, 담당자, 출처, 접수일, 완료일
- 등록/수정 폼: CLAUDE.md 영선 관리 필드 기준
- StatusBadge 컴포넌트 사용 (Phase 3에서 생성한 것)
- 긴급도 배지 (긴급:빨간색/일반:파란색/낮음:회색)
- 출처 필드: 직접입력이면 "직접", 다른 페이지에서 왔으면 출처 페이지명 표시
```

### Phase 5~7 (복붙용)
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase [5/6/7]을 진행해줘.

[Phase 5: /app/room-transfer - 객실이동]
[Phase 6: /app/room-check - 객실체크 + 사진 첨부]
[Phase 7: /app/room-maintenance - 객실정비 + 비용 입력]

각 페이지 조건:
- CLAUDE.md 해당 페이지 필드 기준으로 목록 + 등록/수정 폼
- StatusBadge 컴포넌트 사용
- 상태 드롭다운에서 "영선반" 선택 시 Phase 3의 자동 연동 함수 호출
```

### Phase 8 (복붙용)
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase 8을 진행해줘.

조건:
- 객실이동/객실체크/객실정비 페이지에서 상태를 "영선반"으로 변경 시:
  1. maintenance_requests 테이블에 자동 레코드 생성 확인
  2. "영선 관리 페이지로 이동하시겠습니까?" 다이얼로그 표시
  3. 확인 시 /maintenance 페이지로 이동
  4. 영선 페이지에서 해당 건 조회 가능한지 테스트
- 전체 연동 흐름 통합 테스트
```

### Phase 9~20
```
CLAUDE.md를 읽고 현재 상태를 파악한 다음 Phase [번호]를 진행해줘.
```

---

## 문제 발생 시 대응

| 상황 | 해결 방법 |
|------|----------|
| 오류 발생 | 오류 메시지 그대로 복붙 후 "이 오류 고쳐줘" |
| 화면이 다를 때 | 캡처 올리고 "이렇게 바꿔줘" |
| 다음날 이어서 | "CLAUDE.md 읽고 현재 상태 파악해줘" 먼저 |
| Phase 중간 막힐 때 | 막힌 내용 그대로 질문 |
| 영선 연동 안 될 때 | "status.ts 파일 보여줘" 후 문제 확인 |