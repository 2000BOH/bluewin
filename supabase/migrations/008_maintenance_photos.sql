-- ----------------------------------------------------------------
-- 008_maintenance_photos.sql
-- 영선(maintenance_requests) 사진 첨부 컬럼 추가.
-- room_checks 와 동일하게 Supabase Storage URL 배열을 보관한다.
-- 버킷: maintenance-photos (Supabase 대시보드에서 별도 생성 필요)
-- ----------------------------------------------------------------

alter table public.maintenance_requests
  add column if not exists photos jsonb not null default '[]'::jsonb;

comment on column public.maintenance_requests.photos is
  '영선 요청 첨부 사진 URL 배열 (Supabase Storage public URL). 최대 5장 권장.';
