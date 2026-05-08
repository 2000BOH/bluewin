-- ----------------------------------------------------------------
-- 009_room_contract_files.sql
-- 객실 단위 숙박계약서(PDF) 파일 메타데이터.
-- (phase, room_no) 기준으로 다건 보관 → 최신 1건이 "현재 계약서",
-- 나머지는 펼치기로 이력 확인.
-- 실제 파일은 Supabase Storage 버킷 'room-contracts' 에 저장.
-- ----------------------------------------------------------------

create table if not exists public.room_contract_files (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null,
  room_no text not null,
  file_url text not null,         -- Supabase Storage public URL (또는 signed URL 발급용 path)
  file_path text not null,        -- 버킷 내부 path (삭제·signed URL 용)
  file_name text not null,        -- 원본 파일명 (사용자에게 노출)
  file_size integer,              -- bytes
  contract_date date,             -- 계약 일자 (사용자 입력, 선택)
  guest_name text,                -- 투숙객/임차인 (선택)
  note text,
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_room_contract_files_room
  on public.room_contract_files(phase, room_no, uploaded_at desc);

comment on table public.room_contract_files is
  '객실별 숙박계약서 파일. (phase, room_no) 다건; uploaded_at desc 정렬 시 1번째가 최신';
comment on column public.room_contract_files.file_path is
  'Storage 버킷 내부 경로. signed URL 재발급/삭제 시 사용';
