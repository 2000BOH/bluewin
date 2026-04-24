-- =====================================================
-- Phase A 마이그레이션: 상태 체계 개편 + R&R + 숙박형태 + 민원
-- 변경 요지:
--   1) common_status enum 교체: (접수/처리중/영선반/외부업체/퇴실예정/완료)
--      → (접수/영선/외부업체/퇴실/청소/완료)
--   2) maintenance_source 확장: 'complaint'(민원접수) 추가
--   3) rnr_staff_no enum 생성 + rnr_mapping 테이블 생성
--   4) users.rnr_no 컬럼 추가
--   5) maintenance_requests: stay_type, rnr_no 컬럼 추가
--   6) contracts.note 는 그대로 두되 의미상 "민원내용" 으로 재정의 (코드/UI 레벨)
-- =====================================================

-- ---------------------------------------------------------------
-- 0. 상태 enum 교체
--    PostgreSQL 은 enum 값 제거가 불가능하므로, 신규 enum 타입을 만들고
--    기존 컬럼을 신규 타입으로 변환한 뒤 기존 enum 을 drop 한다.
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'common_status_v2') then
    create type public.common_status_v2 as enum
      ('접수','영선','외부업체','퇴실','청소','완료');
  end if;
end $$;

-- 데이터 매핑 규칙 (신→구):
--   처리중   → 접수   (처리중 개념 제거 → 기본 접수 상태로 통합)
--   영선반   → 영선
--   퇴실예정 → 퇴실
--   나머지(접수/외부업체/완료) → 동일
alter table public.maintenance_requests
  alter column status drop default,
  alter column status type public.common_status_v2
  using (
    case status::text
      when '처리중'   then '접수'
      when '영선반'   then '영선'
      when '퇴실예정' then '퇴실'
      else status::text
    end::public.common_status_v2
  ),
  alter column status set default '접수'::public.common_status_v2;

alter table public.room_transfers
  alter column status drop default,
  alter column status type public.common_status_v2
  using (
    case status::text
      when '처리중'   then '접수'
      when '영선반'   then '영선'
      when '퇴실예정' then '퇴실'
      else status::text
    end::public.common_status_v2
  ),
  alter column status set default '접수'::public.common_status_v2;

alter table public.room_checks
  alter column status drop default,
  alter column status type public.common_status_v2
  using (
    case status::text
      when '처리중'   then '접수'
      when '영선반'   then '영선'
      when '퇴실예정' then '퇴실'
      else status::text
    end::public.common_status_v2
  ),
  alter column status set default '접수'::public.common_status_v2;

alter table public.room_maintenance_tasks
  alter column status drop default,
  alter column status type public.common_status_v2
  using (
    case status::text
      when '처리중'   then '접수'
      when '영선반'   then '영선'
      when '퇴실예정' then '퇴실'
      else status::text
    end::public.common_status_v2
  ),
  alter column status set default '접수'::public.common_status_v2;

-- 구 enum 제거 후 v2 → common_status 로 리네임.
drop type if exists public.common_status;
alter type public.common_status_v2 rename to common_status;

-- ---------------------------------------------------------------
-- 1. maintenance_source 에 'complaint' 추가
--    (민원접수 페이지에서 생성되는 레코드의 출처)
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.maintenance_source'::regtype
      and enumlabel = 'complaint'
  ) then
    alter type public.maintenance_source add value 'complaint';
  end if;
end $$;

-- ---------------------------------------------------------------
-- 2. R&R 담당자 번호 enum + 매핑 테이블
--    - 번호(01~06) 기반으로 식별하고 이름은 rnr_mapping 에서 조회.
--    - 담당자 변경 시 rnr_mapping.name 만 갱신하면 전체 앱에 반영된다.
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rnr_staff_no') then
    create type public.rnr_staff_no as enum ('01','02','03','04','05','06');
  end if;
end $$;

create table if not exists public.rnr_mapping (
  rnr_no public.rnr_staff_no primary key,
  name text,
  stay_types jsonb not null default '[]'::jsonb,   -- 담당 숙박형태 배열
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_set_updated_at_rnr_mapping on public.rnr_mapping;
create trigger trg_set_updated_at_rnr_mapping
  before update on public.rnr_mapping
  for each row execute function public.set_updated_at();

-- 초기 매핑 (CLAUDE.md 기준). 배분 규칙은 관리자가 UI 에서 수정 가능.
insert into public.rnr_mapping (rnr_no, name, stay_types) values
  ('01', null,        '["호텔","기숙사","퇴실","보수중"]'::jsonb),
  ('02', '허아름',    '["장박_법인","장박_개인"]'::jsonb),
  ('03', '김동훈',    '["인스파이어"]'::jsonb),
  ('04', null,        '[]'::jsonb),
  ('05', null,        '[]'::jsonb),
  ('06', '영선',      '[]'::jsonb)
on conflict (rnr_no) do nothing;

-- 01 은 이름이 "유태형" 으로 지정되어 있으나 혹시 사전 데이터 충돌 방지를 위해 분리 upsert.
update public.rnr_mapping set name = coalesce(name, '유태형') where rnr_no = '01';
update public.rnr_mapping set name = coalesce(name, '사원')   where rnr_no = '04';

-- ---------------------------------------------------------------
-- 3. users.rnr_no (직원 ↔ R&R 번호 매핑)
-- ---------------------------------------------------------------
alter table public.users
  add column if not exists rnr_no public.rnr_staff_no;

create index if not exists idx_users_rnr_no on public.users(rnr_no);

-- ---------------------------------------------------------------
-- 4. maintenance_requests: 숙박형태 + R&R 번호 컬럼
--    - stay_type: 접수 시점의 숙박형태 (R&R 자동 배분 근거)
--    - rnr_no:    배분된 담당자 번호
-- ---------------------------------------------------------------
alter table public.maintenance_requests
  add column if not exists stay_type text,
  add column if not exists rnr_no   public.rnr_staff_no;

create index if not exists idx_maint_stay_type on public.maintenance_requests(stay_type);
create index if not exists idx_maint_rnr_no    on public.maintenance_requests(rnr_no);
