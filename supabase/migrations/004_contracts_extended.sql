-- =====================================================
-- Phase C 마이그레이션: contracts 테이블 확장
-- WIN HBO 캡처에 존재하지만 기존 스키마에 누락된 필드들을 추가한다.
-- 기존 값이 있는 컬럼은 그대로 두고 모두 NULL 허용으로 추가.
-- 탭 매핑(7탭 구성):
--   탭1 계약기본 | 탭2 운영정보 | 탭3 초기비용/입주
--   탭4 금융/세금 (마스킹) | 탭5 임차정보 | 탭6 민원/비고 (기존 note 재사용)
--   탭7 수정이력 (change_history 조회)
-- =====================================================

alter table public.contracts
  -- 탭1 계약기본
  add column if not exists total_supply_amount numeric(15,0),  -- 총공급금액
  add column if not exists contract_status     text,            -- 계약상태 (계약중/계약해지/미계약)
  add column if not exists settlement_date     date,            -- 계약(잔금)일

  -- 탭2 운영정보
  add column if not exists entrustment_date    date,            -- 위탁일
  add column if not exists settlement_amount   numeric(15,0),   -- 확정지급액
  add column if not exists commission_amount   numeric(15,0),   -- 수수료금액
  add column if not exists rent_free_months    smallint,        -- 렌트프리기간 (개월)
  add column if not exists stay_agreement      boolean not null default false,  -- 숙박동의서 제출 여부

  -- 탭3 초기비용/입주
  add column if not exists prepaid_mgmt_fee    numeric(15,0),   -- 선수관리비납부
  add column if not exists furniture_fee       numeric(15,0),   -- 비품비납입금
  add column if not exists joint_purchase_fee  numeric(15,0),   -- 가구공동구매입금
  add column if not exists prepaid_mgmt_deposit numeric(15,0),  -- 선수관리예치금
  add column if not exists cash_receipt_reverse boolean not null default false, -- 현금영수증 역발행

  -- 탭4 금융/세금
  add column if not exists account_holder_name text,            -- 계좌성명
  add column if not exists business_name       text,            -- 상호
  add column if not exists representative_name text,            -- 대표자

  -- 탭5 임차정보
  add column if not exists deposit_amount      numeric(15,0),   -- 보증금
  add column if not exists monthly_rent        numeric(15,0);   -- 임대료

-- 인덱스 (필터/검색 성능).
create index if not exists idx_contracts_status on public.contracts(contract_status);
create index if not exists idx_contracts_settlement_date on public.contracts(settlement_date);
