-- =====================================================
-- Phase D 마이그레이션: R&R 담당자 배정 갱신
-- 사이드바 메뉴와 DB 이름을 1:1 동기화한다.
-- 01·02·03·05 에만 이름+직책을 배정. 04·06 은 현재 공석이라 name=null.
-- (04/06 레코드 자체는 삭제하지 않음 — 향후 재배정 가능성 + 영선 전담 로직 보존)
-- =====================================================

update public.rnr_mapping set name = '유태형 과장' where rnr_no = '01';
update public.rnr_mapping set name = '허아름 대리' where rnr_no = '02';
update public.rnr_mapping set name = '김동훈 대리' where rnr_no = '03';
update public.rnr_mapping set name = null          where rnr_no = '04';
update public.rnr_mapping set name = '강민수 사원' where rnr_no = '05';
update public.rnr_mapping set name = null          where rnr_no = '06';

-- 공석 번호(04·06) 의 담당 숙박형태도 비워 두어, 해당 숙박형태 민원은
-- assignRnrByStayType 에서 매칭 없음 → 미배분 처리되도록 한다.
update public.rnr_mapping set stay_types = '[]'::jsonb where rnr_no in ('04','06');
