-- Phase 19: change_history 자동 기록 트리거.
-- 추적 테이블의 INSERT/UPDATE/DELETE 시 public.change_history 에 자동 로그.
-- - UPDATE: 변경된 컬럼별로 1행씩 (field_name_ko 에 컬럼명, old/new 에 jsonb).
-- - INSERT/DELETE: 단일 행, field_name_ko 는 NULL.
-- - changed_by: auth.uid() (인증 컨텍스트가 없으면 NULL).
--
-- field_name_ko 는 컬럼명을 그대로 저장하고, 표시용 한국어 변환은 앱(/history) 에서 처리.

create or replace function public.log_change_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- 추적 대상 테이블에 트리거 부여.
do $$
declare
  t text;
  tables text[] := array[
    'rooms','buyers','contracts','consultations',
    'maintenance_requests','room_transfers','room_checks','room_maintenance_tasks'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_log_change_%I on public.%I;', t, t);
    execute format(
      'create trigger trg_log_change_%I after insert or update or delete on public.%I for each row execute function public.log_change_history();',
      t, t
    );
  end loop;
end $$;
