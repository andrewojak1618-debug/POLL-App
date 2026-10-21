-- One vote submission for one question, matching the agreed card 06 boundary.
-- The later UI decides when to call this RPC; no whole-survey workflow is imposed.
begin;

create function public.vote_for_question(
  p_question_id uuid,
  p_option_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  survey_deadline timestamptz;
  multiple_answers boolean;
  selected_count integer;
  matching_count bigint;
begin
  -- Lock parent rows so the deadline and mode cannot change during this vote.
  -- Concurrent votes for the same survey wait here before checking its deadline.
  select s.deadline, q.allows_multiple_answers
  into survey_deadline, multiple_answers
  from public.survey_questions q
  join public.surveys s on s.id = q.survey_id
  where q.id = p_question_id
  for update of s, q;
  if not found then
    raise exception 'Choose a valid question.' using errcode = '22023';
  end if;

  selected_count := cardinality(p_option_ids);
  if selected_count is null or selected_count = 0 then
    raise exception 'Choose at least one answer.' using errcode = '22023';
  end if;
  if array_ndims(p_option_ids) <> 1 then
    raise exception 'Answer IDs must be a one-dimensional array.' using errcode = '22023';
  end if;
  if (select count(distinct option_id) from unnest(p_option_ids) as chosen(option_id))
      <> selected_count then
    raise exception 'Answer IDs must be distinct and non-null.' using errcode = '22023';
  end if;
  if not multiple_answers and selected_count <> 1 then
    raise exception 'Choose exactly one answer for this question.' using errcode = '22023';
  end if;

  -- Lock options in a stable order and verify every supplied ID belongs here.
  perform o.id from public.survey_options o
  where o.question_id = p_question_id and o.id = any(p_option_ids)
  order by o.id for update;
  get diagnostics matching_count = row_count;
  if matching_count <> selected_count then
    raise exception 'All answers must belong to this question.' using errcode = '22023';
  end if;

  -- Use current wall-clock time after waiting for locks, not transaction start.
  if survey_deadline is not null and survey_deadline <= clock_timestamp() then
    raise exception 'This survey has ended.' using errcode = '22023';
  end if;
  update public.survey_options
  set vote_count = vote_count + 1
  where question_id = p_question_id and id = any(p_option_ids);
  -- Any error (including counter overflow) rolls back the entire submission.
end;
$$;

alter function public.vote_for_question(uuid, uuid[]) owner to postgres;
revoke all on function public.vote_for_question(uuid, uuid[])
  from public, anon, authenticated, service_role;
grant execute on function public.vote_for_question(uuid, uuid[])
  to anon, authenticated;

comment on function public.vote_for_question(uuid, uuid[])
  is 'Atomically increments distinct answer options of one active question. Public without authentication; repeat-vote prevention is outside the agreed scope.';

commit;
