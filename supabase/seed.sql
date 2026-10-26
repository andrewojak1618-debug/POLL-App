-- Initial categories for card 07; run after the schema migrations.
-- Existing categories retain their IDs and names when this seed is repeated.
-- Example vote counts apply only to newly inserted options.
-- Existing options, including earlier zero-vote seeds, retain their current counts.
begin;

insert into public.survey_categories (name, slug)
values
  ('Team Activities', 'team_activities'),
  ('Gaming & Entertainment', 'gaming_entertainment'),
  ('Health & Wellness', 'health_wellness'),
  ('Education & Learning', 'education_learning'),
  ('Lifestyle & Preferences', 'lifestyle_preferences'),
  ('Technology & Innovation', 'technology_innovation')
on conflict (slug) do nothing;

-- Active examples: deadlines are relative to the first insertion.
-- Stable seed IDs avoid duplicates. Reruns preserve deadlines and existing votes.
-- These examples naturally expire; rerunning does not reopen an existing survey.
insert into public.surveys (id, category_id, title, description, deadline)
select seed.id, category.id, seed.title, seed.description, now() + seed.remaining_time
from (values
  ('b7000000-0000-4000-8000-000000000001'::uuid, 'team_activities',
   'Plan our next team afternoon', 'Help us choose an activity for our next team afternoon.', interval '3 days'),
  ('b7000000-0000-4000-8000-000000000002'::uuid, 'gaming_entertainment',
   'Choose our next game night', 'Pick the type of game you would most like to play together.', interval '5 days'),
  ('b7000000-0000-4000-8000-000000000003'::uuid, 'health_wellness',
   'Make our breaks more refreshing', 'Share which activities would help you recharge during the day.', interval '7 days')
) as seed(id, category_slug, title, description, remaining_time)
join public.survey_categories category on category.slug = seed.category_slug
on conflict (id) do nothing;

insert into public.survey_questions (id, survey_id, text, position, allows_multiple_answers)
values
  ('b7100000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001',
   'Which activity would you prefer for our team afternoon?', 0, false),
  ('b7100000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000002',
   'What should we play at the next game night?', 0, false),
  ('b7100000-0000-4000-8000-000000000003', 'b7000000-0000-4000-8000-000000000003',
   'Which activities would you enjoy during a break?', 0, true)
on conflict (id) do nothing;

insert into public.survey_options (id, question_id, text, position, vote_count)
values
  ('b7200000-0000-4000-8000-000000000001', 'b7100000-0000-4000-8000-000000000001', 'A picnic in the park', 0, 12),
  ('b7200000-0000-4000-8000-000000000002', 'b7100000-0000-4000-8000-000000000001', 'An escape room', 1, 8),
  ('b7200000-0000-4000-8000-000000000003', 'b7100000-0000-4000-8000-000000000001', 'A cooking workshop', 2, 5),
  ('b7200000-0000-4000-8000-000000000004', 'b7100000-0000-4000-8000-000000000002', 'Cooperative board games', 0, 9),
  ('b7200000-0000-4000-8000-000000000005', 'b7100000-0000-4000-8000-000000000002', 'A team trivia quiz', 1, 15),
  ('b7200000-0000-4000-8000-000000000006', 'b7100000-0000-4000-8000-000000000002', 'Multiplayer racing games', 2, 3),
  ('b7200000-0000-4000-8000-000000000007', 'b7100000-0000-4000-8000-000000000003', 'A short walk outside', 0, 18),
  ('b7200000-0000-4000-8000-000000000008', 'b7100000-0000-4000-8000-000000000003', 'Gentle stretching', 1, 11),
  ('b7200000-0000-4000-8000-000000000009', 'b7100000-0000-4000-8000-000000000003', 'A quiet screen-free break', 2, 7)
on conflict (id) do nothing;

-- Ending-soon examples: both deadlines start inside the 24-hour window.
-- As above, repeated runs preserve their original deadlines and votes.
insert into public.surveys (id, category_id, title, description, deadline)
select seed.id, category.id, seed.title, seed.description, now() + seed.remaining_time
from (values
  ('b7000000-0000-4000-8000-000000000004'::uuid, 'team_activities',
   'Choose a place for our team lunch', 'Help us decide where to meet for our next team lunch.', interval '6 hours'),
  ('b7000000-0000-4000-8000-000000000005'::uuid, 'gaming_entertainment',
   'Pick a film for movie night', 'Choose the kind of film you would like to watch together.', interval '18 hours')
) as seed(id, category_slug, title, description, remaining_time)
join public.survey_categories category on category.slug = seed.category_slug
on conflict (id) do nothing;

insert into public.survey_questions (id, survey_id, text, position, allows_multiple_answers)
values
  ('b7100000-0000-4000-8000-000000000004', 'b7000000-0000-4000-8000-000000000004',
   'Where would you like to have our team lunch?', 0, false),
  ('b7100000-0000-4000-8000-000000000005', 'b7000000-0000-4000-8000-000000000005',
   'Which kind of film should we watch?', 0, false)
on conflict (id) do nothing;

insert into public.survey_options (id, question_id, text, position, vote_count)
values
  ('b7200000-0000-4000-8000-000000000010', 'b7100000-0000-4000-8000-000000000004', 'The Italian restaurant', 0, 6),
  ('b7200000-0000-4000-8000-000000000011', 'b7100000-0000-4000-8000-000000000004', 'The vegetarian cafe', 1, 10),
  ('b7200000-0000-4000-8000-000000000012', 'b7100000-0000-4000-8000-000000000004', 'A picnic by the river', 2, 2),
  ('b7200000-0000-4000-8000-000000000013', 'b7100000-0000-4000-8000-000000000005', 'A comedy', 0, 14),
  ('b7200000-0000-4000-8000-000000000014', 'b7100000-0000-4000-8000-000000000005', 'A science fiction adventure', 1, 9),
  ('b7200000-0000-4000-8000-000000000015', 'b7100000-0000-4000-8000-000000000005', 'A mystery thriller', 2, 4)
on conflict (id) do nothing;

-- Past examples: seed as database owner, since the creation RPC rejects past deadlines.
-- Creation dates precede deadlines; all timestamps remain unchanged on reruns.
insert into public.surveys (id, category_id, title, description, created_at, deadline)
select seed.id, category.id, seed.title, seed.description,
       now() - interval '14 days', now() - seed.ended_ago
from (values
  ('b7000000-0000-4000-8000-000000000006'::uuid, 'team_activities',
   'Looking back at our team workshop', 'Feedback on the activities at our recent team workshop.', interval '1 day'),
  ('b7000000-0000-4000-8000-000000000007'::uuid, 'gaming_entertainment',
   'Highlights from our last game night', 'Share which part of our last game night you enjoyed most.', interval '3 days'),
  ('b7000000-0000-4000-8000-000000000008'::uuid, 'health_wellness',
   'Review our walking challenge', 'Feedback on the activities in our recent walking challenge.', interval '5 days')
) as seed(id, category_slug, title, description, ended_ago)
join public.survey_categories category on category.slug = seed.category_slug
on conflict (id) do nothing;

insert into public.survey_questions (id, survey_id, text, position, allows_multiple_answers)
values
  ('b7100000-0000-4000-8000-000000000006', 'b7000000-0000-4000-8000-000000000006',
   'Which part of the workshop was most useful?', 0, false),
  ('b7100000-0000-4000-8000-000000000007', 'b7000000-0000-4000-8000-000000000007',
   'What was your highlight of the game night?', 0, false),
  ('b7100000-0000-4000-8000-000000000008', 'b7000000-0000-4000-8000-000000000008',
   'Which walking challenge activities did you enjoy?', 0, true)
on conflict (id) do nothing;

insert into public.survey_options (id, question_id, text, position, vote_count)
values
  ('b7200000-0000-4000-8000-000000000016', 'b7100000-0000-4000-8000-000000000006', 'Planning together', 0, 20),
  ('b7200000-0000-4000-8000-000000000017', 'b7100000-0000-4000-8000-000000000006', 'Solving a team challenge', 1, 13),
  ('b7200000-0000-4000-8000-000000000018', 'b7100000-0000-4000-8000-000000000006', 'Sharing feedback', 2, 7),
  ('b7200000-0000-4000-8000-000000000019', 'b7100000-0000-4000-8000-000000000007', 'The cooperative board game', 0, 16),
  ('b7200000-0000-4000-8000-000000000020', 'b7100000-0000-4000-8000-000000000007', 'The trivia round', 1, 10),
  ('b7200000-0000-4000-8000-000000000021', 'b7100000-0000-4000-8000-000000000007', 'The racing tournament', 2, 6),
  ('b7200000-0000-4000-8000-000000000022', 'b7100000-0000-4000-8000-000000000008', 'Lunchtime walks', 0, 22),
  ('b7200000-0000-4000-8000-000000000023', 'b7100000-0000-4000-8000-000000000008', 'Exploring new routes', 1, 17),
  ('b7200000-0000-4000-8000-000000000024', 'b7100000-0000-4000-8000-000000000008', 'Walking with colleagues', 2, 12)
on conflict (id) do nothing;

-- No-deadline example: NULL keeps this survey active without an expiry date.
-- Stable IDs preserve existing data and votes on repeated runs.
insert into public.surveys (id, category_id, title, description, deadline)
select 'b7000000-0000-4000-8000-000000000009'::uuid, category.id,
       'Share ideas for healthier workdays',
       'Tell us which everyday habits you would like to make time for.', null
from public.survey_categories category
where category.slug = 'health_wellness'
on conflict (id) do nothing;

insert into public.survey_questions (id, survey_id, text, position, allows_multiple_answers)
values
  ('b7100000-0000-4000-8000-000000000009', 'b7000000-0000-4000-8000-000000000009',
   'Which habits would you like to include in your workday?', 0, true)
on conflict (id) do nothing;

insert into public.survey_options (id, question_id, text, position, vote_count)
values
  ('b7200000-0000-4000-8000-000000000025', 'b7100000-0000-4000-8000-000000000009', 'Taking regular screen breaks', 0, 8),
  ('b7200000-0000-4000-8000-000000000026', 'b7100000-0000-4000-8000-000000000009', 'Drinking water regularly', 1, 5),
  ('b7200000-0000-4000-8000-000000000027', 'b7100000-0000-4000-8000-000000000009', 'Going outside at lunchtime', 2, 0)
on conflict (id) do nothing;

commit;
