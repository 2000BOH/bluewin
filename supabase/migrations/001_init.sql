-- =====================================================
-- Bluewin 통합 관리 - 초기 스키마
-- Phase 1: 전체 테이블 + RLS(느슨한 정책) + updated_at 트리거
-- Phase 2 에서 002_rls_roles.sql 로 admin/staff/viewer 정책 강화 예정
-- =====================================================

-- ---------------------------------------------------------------
-- 0. 확장 모듈
-- ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- 1. 공통 트리거 함수: updated_at 자동 갱신
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- 2. 도메인 enum
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'common_status') then
    create type public.common_status as enum
      ('접수','처리중','영선반','외부업체','퇴실예정','완료');
  end if;

  if not exists (select 1 from pg_type where typname = 'urgency_level') then
    create type public.urgency_level as enum ('긴급','일반','낮음');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin','staff','viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'buyer_type') then
    create type public.buyer_type as enum ('개인','법인');
  end if;

  if not exists (select 1 from pg_type where typname = 'maintenance_source') then
    create type public.maintenance_source as enum
      ('직접입력','room-transfer','room-check','room-maintenance');
  end if;

  if not exists (select 1 from pg_type where typname = 'maintenance_type') then
    create type public.maintenance_type as enum
      ('청소','수리','비품교체','도배장판','설비','기타');
  end if;

  if not exists (select 1 from pg_type where typname = 'overall_check_status') then
    create type public.overall_check_status as enum ('정상','주의','불량');
  end if;

  if not exists (select 1 from pg_type where typname = 'history_action') then
    create type public.history_action as enum ('insert','update','delete');
  end if;
end $$;

-- ---------------------------------------------------------------
-- 3. users (직원)
--   - Supabase auth.users 와 1:1 연결될 예정 (Phase 2)
--   - assigned_phase: 한 직원이 담당하는 단일 차수 (NULL 허용)
-- ---------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role public.user_role not null default 'staff',
  assigned_phase smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);

drop trigger if exists trg_set_updated_at_users on public.users;
create trigger trg_set_updated_at_users
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. rooms (객실 마스터)
-- ---------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  type text,
  view_type text,
  land_area numeric(10,2),                 -- 대지면적
  exclusive_area numeric(10,2),            -- 전유면적
  partial_common_area numeric(10,2),       -- 일부공용
  other_common_area numeric(10,2),         -- 기타공용
  parking_common_area numeric(10,2),       -- 주차장공용
  sale_area numeric(10,2),                 -- 분양면적
  exclusive_ratio numeric(5,2),            -- 전유율
  has_terrace boolean not null default false,
  has_attic boolean not null default false,
  sale_price_excl_vat numeric(15,0),       -- 분양금액 (VAT 제외)
  sale_price_incl_vat numeric(15,0),       -- 분양금액 (VAT 포함)
  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_phase_room_no_unique unique (phase, room_no)
);

create index if not exists idx_rooms_phase on public.rooms(phase);
create index if not exists idx_rooms_type on public.rooms(type);

drop trigger if exists trg_set_updated_at_rooms on public.rooms;
create trigger trg_set_updated_at_rooms
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 5. buyers (수분양자)
--   - 주민번호(ssn1, ssn2)는 pgp_sym_encrypt 로 암호화하여 bytea 저장
--   - 대칭키는 환경변수 SUPABASE_SSN_ENCRYPTION_KEY 사용 (앱 레벨에서 주입)
-- ---------------------------------------------------------------
create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  buyer_no text not null unique,
  buyer_type public.buyer_type not null default '개인',

  name1 text not null,
  name2 text,
  ssn1 bytea,                              -- pgp_sym_encrypt 결과 저장
  ssn2 bytea,
  phone1 text,
  phone2 text,
  tel1 text,
  tel2 text,
  email1 text,
  email2 text,
  address1 text,
  address2 text,
  memo1 text,
  memo2 text,

  agree_sms boolean not null default false,
  agree_email boolean not null default false,
  agree_post boolean not null default false,

  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_buyers_name1 on public.buyers(name1);
create index if not exists idx_buyers_buyer_type on public.buyers(buyer_type);

drop trigger if exists trg_set_updated_at_buyers on public.buyers;
create trigger trg_set_updated_at_buyers
  before update on public.buyers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 6. contracts (계약 관리) - 핵심 테이블
--   탭1 계약/운영기본, 탭2 초기비용/입주, 탭3 금융/세금, 탭4 임차정보
-- ---------------------------------------------------------------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  contract_no text unique,
  buyer_id uuid not null references public.buyers(id) on delete restrict,

  -- 탭1: 계약/운영 기본
  contract_form text,                      -- 계약형태
  contract_date date,
  operation_type text,                     -- 운영방식
  operation_start date,
  operation_end date,                      -- 운영종료일 (목록 표시)
  accommodation_type text,                 -- 숙박형태
  reverse_issuance boolean not null default false,  -- 역발행여부

  -- 탭2: 초기비용/입주
  initial_cost numeric(15,0),              -- 초기비용 합계
  initial_cost_detail jsonb,               -- 항목별 상세
  move_in_date date,

  -- 탭3: 금융/세금 (account_no, business_no 는 일반직원에게 마스킹 표시)
  account_bank text,
  account_no text,
  business_no text,
  tax_info jsonb,

  -- 탭4: 임차 정보
  tenant_name text,
  tenant_phone text,
  lease_start date,
  lease_end date,                          -- 임대종료 (목록 표시)

  -- 공통
  note text,                               -- 비고

  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contracts_phase_room_fkey
    foreign key (phase, room_no) references public.rooms(phase, room_no) on update cascade
);

create index if not exists idx_contracts_phase_room on public.contracts(phase, room_no);
create index if not exists idx_contracts_buyer on public.contracts(buyer_id);
create index if not exists idx_contracts_operation_end on public.contracts(operation_end);
create index if not exists idx_contracts_lease_end on public.contracts(lease_end);
create index if not exists idx_contracts_accommodation_type on public.contracts(accommodation_type);

drop trigger if exists trg_set_updated_at_contracts on public.contracts;
create trigger trg_set_updated_at_contracts
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 7. consultations (상담 관리)
-- ---------------------------------------------------------------
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  consult_date date not null default current_date,
  channel text,                            -- 상담 채널 (전화/방문/메일 등)
  title text,
  content text,
  result text,
  note text,
  consultant uuid references public.users(id) on delete set null,
  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consultations_buyer on public.consultations(buyer_id);
create index if not exists idx_consultations_contract on public.consultations(contract_id);
create index if not exists idx_consultations_date on public.consultations(consult_date desc);

drop trigger if exists trg_set_updated_at_consultations on public.consultations;
create trigger trg_set_updated_at_consultations
  before update on public.consultations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 8. maintenance_requests (영선 요청)
--   - source / source_id: 다른 페이지에서 자동 등록된 경우 출처 추적
-- ---------------------------------------------------------------
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  contract_id uuid references public.contracts(id) on delete set null,

  title text not null,
  content text,
  requester text,
  request_date date not null default current_date,
  urgency public.urgency_level not null default '일반',

  status public.common_status not null default '접수',
  assigned_to text,                        -- 담당자(직원명 또는 외부업체명)
  action_content text,                     -- 처리 내용

  source public.maintenance_source not null default '직접입력',
  source_id uuid,                          -- 출처 레코드 ID (FK 가아닌 약한 참조)

  completed_at timestamptz,
  completed_by uuid references public.users(id) on delete set null,

  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_maint_phase_room on public.maintenance_requests(phase, room_no);
create index if not exists idx_maint_status on public.maintenance_requests(status);
create index if not exists idx_maint_urgency on public.maintenance_requests(urgency);
create index if not exists idx_maint_source on public.maintenance_requests(source, source_id);
create index if not exists idx_maint_created on public.maintenance_requests(created_at desc);

drop trigger if exists trg_set_updated_at_maintenance_requests on public.maintenance_requests;
create trigger trg_set_updated_at_maintenance_requests
  before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 9. room_transfers (객실 이동)
-- ---------------------------------------------------------------
create table if not exists public.room_transfers (
  id uuid primary key default gen_random_uuid(),
  from_phase smallint not null,
  from_room_no text not null,
  to_phase smallint not null,
  to_room_no text not null,
  tenant_name text,
  tenant_phone text,
  transfer_date date not null default current_date,
  reason text,
  status public.common_status not null default '접수',
  note text,
  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transfer_from on public.room_transfers(from_phase, from_room_no);
create index if not exists idx_transfer_to on public.room_transfers(to_phase, to_room_no);
create index if not exists idx_transfer_status on public.room_transfers(status);
create index if not exists idx_transfer_date on public.room_transfers(transfer_date desc);

drop trigger if exists trg_set_updated_at_room_transfers on public.room_transfers;
create trigger trg_set_updated_at_room_transfers
  before update on public.room_transfers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 10. room_checks (객실 체크)
--   - checklist: 항목별 정상/불량/해당없음 (jsonb)
--   - photos:    Supabase Storage URL 배열 (jsonb)
-- ---------------------------------------------------------------
create table if not exists public.room_checks (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  contract_id uuid references public.contracts(id) on delete set null,
  check_date date not null default current_date,
  checker text,
  checklist jsonb not null default '{}'::jsonb,
  overall_status public.overall_check_status not null default '정상',
  special_notes text,
  photos jsonb not null default '[]'::jsonb,
  next_check_date date,
  status public.common_status not null default '접수',
  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_check_phase_room on public.room_checks(phase, room_no);
create index if not exists idx_check_status on public.room_checks(status);
create index if not exists idx_check_date on public.room_checks(check_date desc);

drop trigger if exists trg_set_updated_at_room_checks on public.room_checks;
create trigger trg_set_updated_at_room_checks
  before update on public.room_checks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 11. room_maintenance_tasks (객실 정비)
-- ---------------------------------------------------------------
create table if not exists public.room_maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  contract_id uuid references public.contracts(id) on delete set null,
  maintenance_type public.maintenance_type not null,
  content text,
  requester text,
  request_date date not null default current_date,
  assigned_to text,                        -- 직원명 또는 외부업체명
  status public.common_status not null default '접수',
  cost numeric(15,0),
  completed_at timestamptz,
  completed_by uuid references public.users(id) on delete set null,
  creator uuid references public.users(id) on delete set null,
  updater uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rmt_phase_room on public.room_maintenance_tasks(phase, room_no);
create index if not exists idx_rmt_status on public.room_maintenance_tasks(status);
create index if not exists idx_rmt_type on public.room_maintenance_tasks(maintenance_type);
create index if not exists idx_rmt_date on public.room_maintenance_tasks(request_date desc);

drop trigger if exists trg_set_updated_at_rmt on public.room_maintenance_tasks;
create trigger trg_set_updated_at_rmt
  before update on public.room_maintenance_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 12. change_history (전체 수정 이력)
--   - changed_at 은 KST 기준 (Asia/Seoul)
-- ---------------------------------------------------------------
create table if not exists public.change_history (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  field_name_ko text,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default (now() at time zone 'Asia/Seoul'),
  action public.history_action not null default 'update'
);

create index if not exists idx_history_table_record on public.change_history(table_name, record_id);
create index if not exists idx_history_changed_at on public.change_history(changed_at desc);
create index if not exists idx_history_changed_by on public.change_history(changed_by);

-- ---------------------------------------------------------------
-- 13. RLS 정책 (Phase 1: 인증 사용자 전원 read/write — 느슨)
--    Phase 2 에서 002_rls_roles.sql 로 admin/staff/viewer 역할 기반 강화 예정
-- ---------------------------------------------------------------

-- 일반 마스터/트랜잭션 테이블: 인증 시 read/write 모두 허용
do $$
declare
  t text;
begin
  foreach t in array array[
    'rooms','buyers','contracts','consultations',
    'maintenance_requests','room_transfers','room_checks','room_maintenance_tasks'
  ] loop
    execute format('alter table public.%I enable row level security;', t);

    execute format(
      'drop policy if exists "auth_select_%I" on public.%I;', t, t
    );
    execute format(
      'create policy "auth_select_%I" on public.%I for select to authenticated using (true);',
      t, t
    );

    execute format(
      'drop policy if exists "auth_modify_%I" on public.%I;', t, t
    );
    execute format(
      'create policy "auth_modify_%I" on public.%I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- users 테이블: select 는 자기 자신만, 수정은 service_role 만
alter table public.users enable row level security;

drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "users_service_role_all" on public.users;
create policy "users_service_role_all" on public.users
  for all to service_role
  using (true) with check (true);

-- change_history: insert / select 만 허용 (update / delete 차단)
alter table public.change_history enable row level security;

drop policy if exists "history_insert" on public.change_history;
create policy "history_insert" on public.change_history
  for insert to authenticated
  with check (true);

drop policy if exists "history_select" on public.change_history;
create policy "history_select" on public.change_history
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------
-- 끝.
-- 다음 단계: Supabase Auth 사용자 가입 후 public.users.id 와 auth.uid() 연결,
-- Phase 2 에서 002_rls_roles.sql 마이그레이션을 추가해 RLS 를 역할 기반으로 강화한다.
-- ---------------------------------------------------------------
