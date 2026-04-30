-- ----------------------------------------------------------------
-- 007_room_check_detail.sql
-- 객실체크 상세 체크리스트(전자제품/비품/시설상태)용 컬럼 추가.
-- ----------------------------------------------------------------

alter table public.room_checks
  add column if not exists checklist_detail jsonb not null default '[]'::jsonb,
  add column if not exists ok_count         smallint not null default 0,
  add column if not exists need_count       smallint not null default 0,
  add column if not exists move_in_notes    text,
  add column if not exists contract_notes   text,
  add column if not exists move_out_notes   text;

comment on column public.room_checks.checklist_detail is '카테고리별 항목 점검 결과 (CheckItem[])';
comment on column public.room_checks.ok_count        is '이상없음 항목수';
comment on column public.room_checks.need_count      is '조치필요 항목수';
comment on column public.room_checks.move_in_notes   is '입주 시 특이사항';
comment on column public.room_checks.contract_notes  is '계약기간 내 특이사항';
comment on column public.room_checks.move_out_notes  is '퇴거 시 특이사항';
