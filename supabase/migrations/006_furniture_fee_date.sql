-- =====================================================
-- Migration 006: contracts 테이블에 비품비납입일 컬럼 추가
-- 기존 furniture_fee(금액)는 유지, 날짜 컬럼 별도 추가
-- =====================================================

alter table public.contracts
  add column if not exists furniture_fee_date date;  -- 비품비납입일
