-- ============================================================
-- Seed Data for Development
-- Run AFTER applying all migrations.
-- Uses a test user ID — replace with your actual auth.users id.
-- ============================================================

-- To use: paste your user UUID here
DO $$
DECLARE
  v_user_id    UUID := 'aaaaaaaa-0000-0000-0000-000000000001'; -- REPLACE with real user id
  v_project_id UUID := 'bbbbbbbb-0000-0000-0000-000000000001';
  v_brand_id   UUID := 'cccccccc-0000-0000-0000-000000000001';
  v_comp1_id   UUID := 'dddddddd-0000-0000-0000-000000000001';
  v_comp2_id   UUID := 'dddddddd-0000-0000-0000-000000000002';
  v_prompt1_id UUID := 'eeeeeeee-0000-0000-0000-000000000001';
  v_prompt2_id UUID := 'eeeeeeee-0000-0000-0000-000000000002';
  v_prompt3_id UUID := 'eeeeeeee-0000-0000-0000-000000000003';
  v_prompt4_id UUID := 'eeeeeeee-0000-0000-0000-000000000004';
  v_prompt5_id UUID := 'eeeeeeee-0000-0000-0000-000000000005';
BEGIN

-- Project
INSERT INTO public.projects (id, name, owner_id) VALUES
  (v_project_id, 'Pooch & Mutt', v_user_id);

-- Primary brand
INSERT INTO public.brands (id, project_id, name, domain, is_primary) VALUES
  (v_brand_id, v_project_id, 'Pooch & Mutt', 'poochandmutt.com', TRUE);

-- Competitors
INSERT INTO public.competitors (id, project_id, name, domain) VALUES
  (v_comp1_id, v_project_id, 'Butternut Box', 'butternutbox.com'),
  (v_comp2_id, v_project_id, "Lily's Kitchen", 'lilyskitchen.co.uk');

-- Prompts
INSERT INTO public.prompts (id, project_id, prompt_text, volume, priority) VALUES
  (v_prompt1_id, v_project_id, 'best dog food UK', 6800, 'high'),
  (v_prompt2_id, v_project_id, 'best dog food for sensitive stomachs', 4200, 'high'),
  (v_prompt3_id, v_project_id, 'dog food with natural ingredients', 2100, 'medium'),
  (v_prompt4_id, v_project_id, 'gut health dog food', 1800, 'medium'),
  (v_prompt5_id, v_project_id, 'premium dog food subscription UK', 1400, 'low');

-- Runs and mentions (7 days × 2 platforms × 5 prompts = 70 runs, abbreviated here)
-- Generate 14 sample runs for prompt1 across 7 days

INSERT INTO public.runs (id, prompt_id, platform, model_name, run_date, status, raw_response) VALUES
  ('ffffffff-0000-0000-0001-000000000001', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '6 days', 'success', 'When it comes to the best dog food in the UK, several brands stand out. **Pooch & Mutt** is widely recommended for its focus on gut health and functional ingredients. **Butternut Box** offers fresh, human-grade meals. **Lily''s Kitchen** provides natural, wholesome recipes.'),
  ('ffffffff-0000-0000-0001-000000000002', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '6 days', 'success', 'The best dog foods in the UK include **Butternut Box** (fresh meals), **Pooch & Mutt** (gut health focus), and **Lily''s Kitchen** (natural ingredients).'),
  ('ffffffff-0000-0000-0001-000000000003', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '5 days', 'success', '**Butternut Box** tops many lists for its fresh food approach. **Pooch & Mutt** is popular for dogs needing gut support, and **Lily''s Kitchen** is a top pick for natural nutrition.'),
  ('ffffffff-0000-0000-0001-000000000004', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '5 days', 'success', 'Top UK dog food brands: **Butternut Box**, **Pooch & Mutt**, **Scrumbles**.'),
  ('ffffffff-0000-0000-0001-000000000005', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '4 days', 'success', '**Pooch & Mutt** leads for gut health. **Butternut Box** is great for fresh food. **Lily''s Kitchen** offers organic options.'),
  ('ffffffff-0000-0000-0001-000000000006', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '4 days', 'success', 'Among the best UK dog foods: **Butternut Box**, **Pooch & Mutt**, and **Different Dog**.'),
  ('ffffffff-0000-0000-0001-000000000007', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '3 days', 'success', '**Pooch & Mutt** is highly rated for gut health dog food. **Butternut Box** and **Lily''s Kitchen** are also excellent.'),
  ('ffffffff-0000-0000-0001-000000000008', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '3 days', 'success', 'Best UK dog food: **Butternut Box** (1), **Pooch & Mutt** (2), **Lily''s Kitchen** (3).'),
  ('ffffffff-0000-0000-0001-000000000009', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '2 days', 'success', '**Butternut Box** is arguably the best fresh dog food. **Pooch & Mutt** excels in gut health.'),
  ('ffffffff-0000-0000-0001-000000000010', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '2 days', 'success', 'Top dog foods UK: **Pooch & Mutt**, **Butternut Box**, **Lily''s Kitchen**.'),
  ('ffffffff-0000-0000-0001-000000000011', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW() - INTERVAL '1 day',  'success', '**Pooch & Mutt** is a top pick for gut health. **Butternut Box** for fresh food lovers.'),
  ('ffffffff-0000-0000-0001-000000000012', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW() - INTERVAL '1 day',  'success', 'Best dog food UK: **Butternut Box**, **Pooch & Mutt**, **Scrumbles**.'),
  ('ffffffff-0000-0000-0001-000000000013', v_prompt1_id, 'chatgpt', 'gpt-4o', NOW(),                       'success', '**Pooch & Mutt** is excellent for digestive health. **Butternut Box** is a favourite for fresh meals.'),
  ('ffffffff-0000-0000-0001-000000000014', v_prompt1_id, 'gemini',  'gemini-1.5-pro', NOW(),                'success', 'Top UK dog food: **Butternut Box** (1), **Lily''s Kitchen** (2), **Pooch & Mutt** (3).');

-- Mentions for the runs above (own brand = Pooch & Mutt)
INSERT INTO public.mentions (run_id, brand_id, position, sentiment, mentioned, snippet) VALUES
  ('ffffffff-0000-0000-0001-000000000001', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt is widely recommended for its focus on gut health'),
  ('ffffffff-0000-0000-0001-000000000002', v_brand_id, 2, 'positive', TRUE, 'Pooch & Mutt (gut health focus)'),
  ('ffffffff-0000-0000-0001-000000000003', v_brand_id, 2, 'positive', TRUE, 'Pooch & Mutt is popular for dogs needing gut support'),
  ('ffffffff-0000-0000-0001-000000000004', v_brand_id, 2, 'neutral',  TRUE, 'Pooch & Mutt'),
  ('ffffffff-0000-0000-0001-000000000005', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt leads for gut health'),
  ('ffffffff-0000-0000-0001-000000000006', v_brand_id, 2, 'neutral',  TRUE, 'Pooch & Mutt'),
  ('ffffffff-0000-0000-0001-000000000007', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt is highly rated for gut health dog food'),
  ('ffffffff-0000-0000-0001-000000000008', v_brand_id, 2, 'positive', TRUE, 'Pooch & Mutt (2)'),
  ('ffffffff-0000-0000-0001-000000000009', v_brand_id, 2, 'positive', TRUE, 'Pooch & Mutt excels in gut health'),
  ('ffffffff-0000-0000-0001-000000000010', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt'),
  ('ffffffff-0000-0000-0001-000000000011', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt is a top pick for gut health'),
  ('ffffffff-0000-0000-0001-000000000012', v_brand_id, 2, 'neutral',  TRUE, 'Pooch & Mutt'),
  ('ffffffff-0000-0000-0001-000000000013', v_brand_id, 1, 'positive', TRUE, 'Pooch & Mutt is excellent for digestive health'),
  ('ffffffff-0000-0000-0001-000000000014', v_brand_id, 3, 'positive', TRUE, 'Pooch & Mutt (3)');

-- Citations
INSERT INTO public.citations (run_id, domain, url, title, brand_id, position) VALUES
  ('ffffffff-0000-0000-0001-000000000001', 'poochandmutt.com', 'https://poochandmutt.com/blogs/health/best-dog-food', 'Best Dog Food Guide - Pooch & Mutt', v_brand_id, 1),
  ('ffffffff-0000-0000-0001-000000000001', 'reddit.com', 'https://reddit.com/r/dogs/comments/best-uk-dog-food', 'Best dog food UK - Reddit', NULL, 2),
  ('ffffffff-0000-0000-0001-000000000001', 'butternutbox.com', 'https://butternutbox.com/why-fresh', 'Why Fresh Dog Food?', NULL, 3),
  ('ffffffff-0000-0000-0001-000000000002', 'butternutbox.com', 'https://butternutbox.com', 'Butternut Box Fresh Dog Food', NULL, 1),
  ('ffffffff-0000-0000-0001-000000000002', 'reddit.com', 'https://reddit.com/r/dogs/comments/dog-food-recs', 'Dog food recommendations - Reddit', NULL, 2),
  ('ffffffff-0000-0000-0001-000000000003', 'poochandmutt.com', 'https://poochandmutt.com/blogs/health/gut-health', 'Gut Health for Dogs - Pooch & Mutt', v_brand_id, 1),
  ('ffffffff-0000-0000-0001-000000000003', 'trustpilot.com', 'https://trustpilot.com/review/poochandmutt.com', 'Pooch & Mutt Reviews - Trustpilot', NULL, 2);

-- Seed 7 days of visibility scores for own brand (both platforms)
INSERT INTO public.visibility_scores (project_id, brand_id, date, platform, mention_score, position_score, citation_score, sentiment_score, total_score) VALUES
  (v_project_id, v_brand_id, CURRENT_DATE - 6, 'chatgpt', 80, 70, 60, 90, 74.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 6, 'gemini',  60, 60, 40, 70, 58.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 5, 'chatgpt', 80, 60, 40, 80, 67.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 5, 'gemini',  60, 50, 40, 60, 54.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 4, 'chatgpt', 100, 90, 60, 90, 88.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 4, 'gemini',  60, 60, 40, 70, 58.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 3, 'chatgpt', 100, 90, 60, 90, 88.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 3, 'gemini',  80, 70, 40, 80, 72.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 2, 'chatgpt', 100, 80, 40, 90, 84.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 2, 'gemini',  100, 90, 60, 90, 88.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 1, 'chatgpt', 100, 90, 60, 90, 88.0),
  (v_project_id, v_brand_id, CURRENT_DATE - 1, 'gemini',  80, 60, 40, 70, 68.0),
  (v_project_id, v_brand_id, CURRENT_DATE,     'chatgpt', 100, 80, 60, 90, 85.0),
  (v_project_id, v_brand_id, CURRENT_DATE,     'gemini',  60, 50, 40, 80, 57.0);

END $$;
