-- Public reads for the survey tables; direct browser writes remain disabled.
-- Write functions and their EXECUTE permissions follow separately in card 06.
begin;

-- Remove default table privileges, including TRUNCATE, which RLS does not guard.
-- PUBLIC is included because its privileges are inherited by browser roles.
revoke all privileges on table
  public.survey_categories,
  public.surveys,
  public.survey_questions,
  public.survey_options
from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table
  public.survey_categories,
  public.surveys,
  public.survey_questions,
  public.survey_options
to anon, authenticated;

-- RLS was enabled by the preceding table migration and stays enabled.
create policy survey_categories_public_read
  on public.survey_categories for select
  to anon, authenticated using (true);

create policy surveys_public_read
  on public.surveys for select
  to anon, authenticated using (true);

create policy survey_questions_public_read
  on public.survey_questions for select
  to anon, authenticated using (true);

create policy survey_options_public_read
  on public.survey_options for select
  to anon, authenticated using (true);

commit;
