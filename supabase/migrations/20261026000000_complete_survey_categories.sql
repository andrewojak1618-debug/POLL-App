-- Completes the category list shown in Figma; preserves all existing identifiers.
insert into public.survey_categories (name, slug)
values
  ('Education & Learning', 'education_learning'),
  ('Lifestyle & Preferences', 'lifestyle_preferences'),
  ('Technology & Innovation', 'technology_innovation')
on conflict (slug) do nothing;
