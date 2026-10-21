-- Creates one complete survey atomically; direct table writes stay revoked.
-- p_questions matches CreateSurveyQuestionData: text, allowsMultipleAnswers,
-- options: [{"text": "..."}]. Array order determines zero-based positions.
-- p_deadline is an explicit timestamp (or NULL), not a calendar-date rule.
begin;

create function public.create_survey_with_questions(
  p_category_id uuid,
  p_title text,
  p_description text,
  p_deadline timestamptz,
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_survey_id uuid;
  new_question_id uuid;
  question_data jsonb;
  option_data jsonb;
  question_position bigint;
  option_position bigint;
begin
  if p_title is null or p_title !~ '[^[:space:]]' then
    raise exception 'Survey title is required.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.survey_categories where id = p_category_id) then
    raise exception 'Choose a valid category.' using errcode = '22023';
  end if;
  if p_deadline is not null and
     (not isfinite(p_deadline) or p_deadline <= statement_timestamp()) then
    raise exception 'The deadline must be in the future.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Questions must be an array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_questions) = 0 then
    raise exception 'At least one question is required.' using errcode = '22023';
  end if;

  insert into public.surveys(category_id, title, description, deadline)
  values (p_category_id, p_title, p_description, p_deadline)
  returning id into new_survey_id;

  for question_data, question_position in
    select value, ordinality - 1 from jsonb_array_elements(p_questions) with ordinality
  loop
    if jsonb_typeof(question_data) is distinct from 'object' or
       jsonb_typeof(question_data -> 'text') is distinct from 'string' or
       coalesce(question_data ->> 'text', '') !~ '[^[:space:]]' then
      raise exception 'Each question needs non-empty text.' using errcode = '22023';
    end if;
    if jsonb_typeof(question_data -> 'allowsMultipleAnswers') is distinct from 'boolean' then
      raise exception 'Each question needs a boolean selection mode.' using errcode = '22023';
    end if;
    if jsonb_typeof(question_data -> 'options') is distinct from 'array' then
      raise exception 'Answer options must be an array.' using errcode = '22023';
    end if;
    if jsonb_array_length(question_data -> 'options') < 2 then
      raise exception 'Each question needs at least two options.' using errcode = '22023';
    end if;

    insert into public.survey_questions(survey_id, text, position, allows_multiple_answers)
    values (new_survey_id, question_data ->> 'text', question_position,
            (question_data ->> 'allowsMultipleAnswers')::boolean)
    returning id into new_question_id;

    for option_data, option_position in
      select value, ordinality - 1
      from jsonb_array_elements(question_data -> 'options') with ordinality
    loop
      if jsonb_typeof(option_data) is distinct from 'object' or
         jsonb_typeof(option_data -> 'text') is distinct from 'string' or
         coalesce(option_data ->> 'text', '') !~ '[^[:space:]]' then
        raise exception 'Each option needs non-empty text.' using errcode = '22023';
      end if;
      insert into public.survey_options(question_id, text, position, vote_count)
      values (new_question_id, option_data ->> 'text', option_position, 0);
    end loop;
  end loop;

  -- Unhandled validation errors roll back every insert made by this call.
  -- IDs and created_at use database defaults; caller-supplied IDs/counts are ignored.
  return new_survey_id;
end;
$$;

-- Execute as the migration owner to allow only these validated inserts through RLS.
-- No general INSERT/UPDATE/DELETE grants or policies are added.
alter function public.create_survey_with_questions(uuid, text, text, timestamptz, jsonb)
  owner to postgres;
revoke all on function public.create_survey_with_questions(uuid, text, text, timestamptz, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.create_survey_with_questions(uuid, text, text, timestamptz, jsonb)
  to anon, authenticated;

comment on function public.create_survey_with_questions(uuid, text, text, timestamptz, jsonb)
  is 'Creates a complete survey and returns its UUID. Public without authentication; abuse prevention is outside the agreed scope.';

commit;
