-- Survey structure only. Policies and write functions follow in card 06.
-- Applying this migration does not modify the existing products table.
begin;

create table public.survey_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name ~ '[^[:space:]]'),
  slug text not null unique check (slug ~ '[^[:space:]]')
);

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.survey_categories(id) on delete restrict,
  title text not null check (title ~ '[^[:space:]]'),
  description text,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  text text not null check (text ~ '[^[:space:]]'),
  position integer not null check (position >= 0),
  allows_multiple_answers boolean not null default false,
  constraint survey_questions_survey_position_key unique (survey_id, position)
);

create table public.survey_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  text text not null check (text ~ '[^[:space:]]'),
  position integer not null check (position >= 0),
  vote_count integer not null default 0 check (vote_count >= 0),
  constraint survey_options_question_position_key unique (question_id, position)
);

create index surveys_category_id_idx on public.surveys (category_id);
create index surveys_deadline_idx on public.surveys (deadline);
-- The composite unique constraints already index survey_id and question_id.

-- Deny browser access until explicit policies and RPC grants are added.
alter table public.survey_categories enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_options enable row level security;

-- Minimum one question and two options per question require the atomic
-- creation function in card 06; row CHECK constraints cannot enforce them.
-- deadline maps to Survey.endsAt; created_at maps to Survey.createdAt.
-- No calendar-date timezone or end-of-day conversion is imposed here.
commit;
