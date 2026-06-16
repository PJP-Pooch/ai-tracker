-- ============================================================
-- Migration 015: Gemini Scraper Platform Support
-- ============================================================

-- 1. Remove old platform constraint
ALTER TABLE public.runs
  DROP CONSTRAINT IF EXISTS runs_platform_check;

-- 2. Add updated platform constraint with gemini_scraper support
ALTER TABLE public.runs
  ADD CONSTRAINT runs_platform_check
  CHECK (platform IN ('chatgpt', 'gemini', 'chatgpt_scraper', 'gemini_scraper'));
