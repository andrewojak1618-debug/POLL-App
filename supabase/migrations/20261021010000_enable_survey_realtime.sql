-- Enable Postgres Changes for survey creation and voting (card 10).
-- Run after the survey schema migrations, using the database owner.
-- Existing RLS policies and table privileges remain unchanged.
begin;

do $$
declare
  survey_table text;
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    raise exception 'Required publication supabase_realtime does not exist.';
  end if;

  foreach survey_table in array array['surveys', 'survey_questions', 'survey_options']
  loop
    -- Skip tables already enabled, including manual Dashboard configuration.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = survey_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', survey_table);
    end if;
  end loop;
end;
$$;

-- No old-row payload is needed: the existing primary keys identify changed rows.
-- Unrelated publication members are preserved.
commit;
