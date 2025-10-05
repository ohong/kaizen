create or replace function public.run_sql(query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text := trim(query);
  forbidden text[] := array['insert', 'update', 'delete', 'drop', 'alter', 'truncate', 'grant', 'revoke'];
  token text;
  result jsonb;
begin
  if cleaned is null or cleaned = '' then
    raise exception 'Query must not be empty';
  end if;

  if position(';' in cleaned) > 0 then
    raise exception 'Multiple statements are not allowed';
  end if;

  if cleaned !~* '^select\\b' then
    raise exception 'Only SELECT queries are permitted';
  end if;

  foreach token in array forbidden loop
    if cleaned ~* ('\\m' || token || '\\M') then
      raise exception 'Forbidden keyword detected: %', token;
    end if;
  end loop;

  execute format('select json_agg(t) from (%s) t', cleaned) into result;
  return coalesce(result, '[]'::jsonb);
end;
$$;

do $$
begin
  grant execute on function public.run_sql(text) to service_role;
  grant execute on function public.run_sql(text) to authenticated;
  grant execute on function public.run_sql(text) to anon;
exception
  when undefined_object then null;
end;
$$;
