-- ============================================================
-- Migration 014: Scraper Platform & Scraper Payload
-- ============================================================

-- 1. Remove old platform constraint
ALTER TABLE public.runs
  DROP CONSTRAINT IF EXISTS runs_platform_check;

-- 2. Add updated platform constraint with scraper support
ALTER TABLE public.runs
  ADD CONSTRAINT runs_platform_check
  CHECK (platform IN ('chatgpt', 'gemini', 'chatgpt_scraper'));

-- 3. Add scraper_payload JSONB column to runs table
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS scraper_payload JSONB DEFAULT NULL;
