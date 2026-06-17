-- ============================================================
-- Migration 019: Project Market / Location Settings
-- ============================================================

-- Add target market columns to projects table.
-- target_location_code: DataForSEO location code (e.g. 2840 = United States, 2826 = United Kingdom)
-- target_language_code: ISO 639-1 language code (e.g. 'en', 'de', 'fr')

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS target_location_code INTEGER DEFAULT 2840,
  ADD COLUMN IF NOT EXISTS target_language_code TEXT DEFAULT 'en';
