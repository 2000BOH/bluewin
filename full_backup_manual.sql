-- Bluewin Schema Backup (Manual Extraction)
-- Generated at: 2026-04-23T11:37:02.667Z

-- Enum: buyer_type
CREATE TYPE public.buyer_type AS ENUM ('개인', '법인');

-- Enum: common_status
CREATE TYPE public.common_status AS ENUM ('접수', '처리중', '영선반', '외부업체', '퇴실예정', '완료');

-- Enum: history_action
CREATE TYPE public.history_action AS ENUM ('insert', 'update', 'delete');

-- Enum: maintenance_source
CREATE TYPE public.maintenance_source AS ENUM ('직접입력', 'room-transfer', 'room-check', 'room-maintenance');

-- Enum: maintenance_type
CREATE TYPE public.maintenance_type AS ENUM ('청소', '수리', '비품교체', '도배장판', '설비', '기타');

-- Enum: overall_check_status
CREATE TYPE public.overall_check_status AS ENUM ('정상', '주의', '불량');

-- Enum: urgency_level
CREATE TYPE public.urgency_level AS ENUM ('긴급', '일반', '낮음');

-- Enum: user_role
CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'viewer');

-- Table Structure: rooms
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  phase smallint NOT NULL
  room_no text NOT NULL
  type text NULL
  view_type text NULL
  land_area numeric NULL
  exclusive_area numeric NULL
  partial_common_area numeric NULL
  other_common_area numeric NULL
  parking_common_area numeric NULL
  sale_area numeric NULL
  exclusive_ratio numeric NULL
  has_terrace boolean NOT NULL DEFAULT false
  has_attic boolean NOT NULL DEFAULT false
  sale_price_excl_vat numeric NULL
  sale_price_incl_vat numeric NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: buyers
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  buyer_no text NOT NULL
  buyer_type USER-DEFINED NOT NULL DEFAULT '개인'::buyer_type
  name1 text NOT NULL
  name2 text NULL
  ssn1 bytea NULL
  ssn2 bytea NULL
  phone1 text NULL
  phone2 text NULL
  tel1 text NULL
  tel2 text NULL
  email1 text NULL
  email2 text NULL
  address1 text NULL
  address2 text NULL
  memo1 text NULL
  memo2 text NULL
  agree_sms boolean NOT NULL DEFAULT false
  agree_email boolean NOT NULL DEFAULT false
  agree_post boolean NOT NULL DEFAULT false
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: contracts
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  phase smallint NOT NULL
  room_no text NOT NULL
  contract_no text NULL
  buyer_id uuid NOT NULL
  contract_form text NULL
  contract_date date NULL
  operation_type text NULL
  operation_start date NULL
  operation_end date NULL
  accommodation_type text NULL
  reverse_issuance boolean NOT NULL DEFAULT false
  initial_cost numeric NULL
  initial_cost_detail jsonb NULL
  move_in_date date NULL
  account_bank text NULL
  account_no text NULL
  business_no text NULL
  tax_info jsonb NULL
  tenant_name text NULL
  tenant_phone text NULL
  lease_start date NULL
  lease_end date NULL
  note text NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: users
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  email text NOT NULL
  name text NOT NULL
  role USER-DEFINED NOT NULL DEFAULT 'staff'::user_role
  assigned_phase smallint NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: change_history
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  table_name text NOT NULL
  record_id uuid NOT NULL
  field_name_ko text NULL
  old_value jsonb NULL
  new_value jsonb NULL
  changed_by uuid NULL
  changed_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul'::text)
  action USER-DEFINED NOT NULL DEFAULT 'update'::history_action
*/

-- Table Structure: consultations
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  buyer_id uuid NOT NULL
  contract_id uuid NULL
  consult_date date NOT NULL DEFAULT CURRENT_DATE
  channel text NULL
  title text NULL
  content text NULL
  result text NULL
  note text NULL
  consultant uuid NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: maintenance_requests
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  phase smallint NOT NULL
  room_no text NOT NULL
  contract_id uuid NULL
  title text NOT NULL
  content text NULL
  requester text NULL
  request_date date NOT NULL DEFAULT CURRENT_DATE
  urgency USER-DEFINED NOT NULL DEFAULT '일반'::urgency_level
  status USER-DEFINED NOT NULL DEFAULT '접수'::common_status
  assigned_to text NULL
  action_content text NULL
  source USER-DEFINED NOT NULL DEFAULT '직접입력'::maintenance_source
  source_id uuid NULL
  completed_at timestamp with time zone NULL
  completed_by uuid NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: room_transfers
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  from_phase smallint NOT NULL
  from_room_no text NOT NULL
  to_phase smallint NOT NULL
  to_room_no text NOT NULL
  tenant_name text NULL
  tenant_phone text NULL
  transfer_date date NOT NULL DEFAULT CURRENT_DATE
  reason text NULL
  status USER-DEFINED NOT NULL DEFAULT '접수'::common_status
  note text NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: room_checks
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  phase smallint NOT NULL
  room_no text NOT NULL
  contract_id uuid NULL
  check_date date NOT NULL DEFAULT CURRENT_DATE
  checker text NULL
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb
  overall_status USER-DEFINED NOT NULL DEFAULT '정상'::overall_check_status
  special_notes text NULL
  photos jsonb NOT NULL DEFAULT '[]'::jsonb
  next_check_date date NULL
  status USER-DEFINED NOT NULL DEFAULT '접수'::common_status
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Table Structure: room_maintenance_tasks
/*
  id uuid NOT NULL DEFAULT gen_random_uuid()
  phase smallint NOT NULL
  room_no text NOT NULL
  contract_id uuid NULL
  maintenance_type USER-DEFINED NOT NULL
  content text NULL
  requester text NULL
  request_date date NOT NULL DEFAULT CURRENT_DATE
  assigned_to text NULL
  status USER-DEFINED NOT NULL DEFAULT '접수'::common_status
  cost numeric NULL
  completed_at timestamp with time zone NULL
  completed_by uuid NULL
  creator uuid NULL
  updater uuid NULL
  created_at timestamp with time zone NOT NULL DEFAULT now()
  updated_at timestamp with time zone NOT NULL DEFAULT now()
*/

-- Function: set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

-- Function: log_change_history
CREATE OR REPLACE FUNCTION public.log_change_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  changed_user uuid := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
  rec_id       uuid;
  col_name     text;
  old_val      jsonb;
  new_val      jsonb;
  old_json     jsonb;
  new_json     jsonb;
begin
  -- auth.uid() 폴백 (current_setting 결과가 없을 때).
  if changed_user is null then
    begin
      changed_user := auth.uid();
    exception when others then
      changed_user := null;
    end;
  end if;

  if (tg_op = 'INSERT') then
    rec_id := (to_jsonb(new) ->> 'id')::uuid;
    insert into public.change_history(table_name, record_id, field_name_ko, old_value, new_value, changed_by, action)
    values (tg_table_name, rec_id, null, null, to_jsonb(new), changed_user, 'insert'::history_action);
    return new;

  elsif (tg_op = 'DELETE') then
    rec_id := (to_jsonb(old) ->> 'id')::uuid;
    insert into public.change_history(table_name, record_id, field_name_ko, old_value, new_value, changed_by, action)
    values (tg_table_name, rec_id, null, to_jsonb(old), null, changed_user, 'delete'::history_action);
    return old;

  elsif (tg_op = 'UPDATE') then
    rec_id := (to_jsonb(new) ->> 'id')::uuid;
    old_json := to_jsonb(old);
    new_json := to_jsonb(new);

    for col_name in
      select key
      from jsonb_each(new_json)
      where key not in ('updated_at', 'updater')
    loop
      old_val := old_json -> col_name;
      new_val := new_json -> col_name;
      if old_val is distinct from new_val then
        insert into public.change_history(table_name, record_id, field_name_ko, old_value, new_value, changed_by, action)
        values (tg_table_name, rec_id, col_name, old_val, new_val, changed_user, 'update'::history_action);
      end if;
    end loop;
    return new;
  end if;

  return null;
end;
$function$
;

-- Function: encrypt_ssn
CREATE OR REPLACE FUNCTION public.encrypt_ssn(plain text, key text)
 RETURNS bytea
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT pgp_sym_encrypt(plain, key);
$function$
;

-- Trigger: trg_set_updated_at_users
CREATE TRIGGER trg_set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_rooms
CREATE TRIGGER trg_set_updated_at_rooms BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_buyers
CREATE TRIGGER trg_set_updated_at_buyers BEFORE UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_contracts
CREATE TRIGGER trg_set_updated_at_contracts BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_consultations
CREATE TRIGGER trg_set_updated_at_consultations BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_maintenance_requests
CREATE TRIGGER trg_set_updated_at_maintenance_requests BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_room_transfers
CREATE TRIGGER trg_set_updated_at_room_transfers BEFORE UPDATE ON public.room_transfers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_room_checks
CREATE TRIGGER trg_set_updated_at_room_checks BEFORE UPDATE ON public.room_checks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_set_updated_at_rmt
CREATE TRIGGER trg_set_updated_at_rmt BEFORE UPDATE ON public.room_maintenance_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: trg_log_change_rooms
CREATE TRIGGER trg_log_change_rooms AFTER INSERT OR DELETE OR UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_buyers
CREATE TRIGGER trg_log_change_buyers AFTER INSERT OR DELETE OR UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_contracts
CREATE TRIGGER trg_log_change_contracts AFTER INSERT OR DELETE OR UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_consultations
CREATE TRIGGER trg_log_change_consultations AFTER INSERT OR DELETE OR UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_maintenance_requests
CREATE TRIGGER trg_log_change_maintenance_requests AFTER INSERT OR DELETE OR UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_room_transfers
CREATE TRIGGER trg_log_change_room_transfers AFTER INSERT OR DELETE OR UPDATE ON public.room_transfers FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_room_checks
CREATE TRIGGER trg_log_change_room_checks AFTER INSERT OR DELETE OR UPDATE ON public.room_checks FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Trigger: trg_log_change_room_maintenance_tasks
CREATE TRIGGER trg_log_change_room_maintenance_tasks AFTER INSERT OR DELETE OR UPDATE ON public.room_maintenance_tasks FOR EACH ROW EXECUTE FUNCTION log_change_history();

-- Policy: auth_select_rooms on rooms
CREATE POLICY "auth_select_rooms" ON public."rooms"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_rooms on rooms
CREATE POLICY "auth_modify_rooms" ON public."rooms"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_buyers on buyers
CREATE POLICY "auth_select_buyers" ON public."buyers"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_buyers on buyers
CREATE POLICY "auth_modify_buyers" ON public."buyers"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_contracts on contracts
CREATE POLICY "auth_select_contracts" ON public."contracts"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_contracts on contracts
CREATE POLICY "auth_modify_contracts" ON public."contracts"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_consultations on consultations
CREATE POLICY "auth_select_consultations" ON public."consultations"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_consultations on consultations
CREATE POLICY "auth_modify_consultations" ON public."consultations"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_maintenance_requests on maintenance_requests
CREATE POLICY "auth_select_maintenance_requests" ON public."maintenance_requests"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_maintenance_requests on maintenance_requests
CREATE POLICY "auth_modify_maintenance_requests" ON public."maintenance_requests"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_room_transfers on room_transfers
CREATE POLICY "auth_select_room_transfers" ON public."room_transfers"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_room_transfers on room_transfers
CREATE POLICY "auth_modify_room_transfers" ON public."room_transfers"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_room_checks on room_checks
CREATE POLICY "auth_select_room_checks" ON public."room_checks"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_room_checks on room_checks
CREATE POLICY "auth_modify_room_checks" ON public."room_checks"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: auth_select_room_maintenance_tasks on room_maintenance_tasks
CREATE POLICY "auth_select_room_maintenance_tasks" ON public."room_maintenance_tasks"
  FOR SELECT TO authenticated
  USING (true)
;

-- Policy: auth_modify_room_maintenance_tasks on room_maintenance_tasks
CREATE POLICY "auth_modify_room_maintenance_tasks" ON public."room_maintenance_tasks"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true)
;

-- Policy: users_self_select on users
CREATE POLICY "users_self_select" ON public."users"
  FOR SELECT TO authenticated
  USING ((id = auth.uid()))
;

-- Policy: users_service_role_all on users
CREATE POLICY "users_service_role_all" ON public."users"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true)
;

-- Policy: history_insert on change_history
CREATE POLICY "history_insert" ON public."change_history"
  FOR INSERT TO authenticated
  WITH CHECK (true)
;

-- Policy: history_select on change_history
CREATE POLICY "history_select" ON public."change_history"
  FOR SELECT TO authenticated
  USING (true)
;

