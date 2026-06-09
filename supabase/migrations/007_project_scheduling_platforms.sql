-- ============================================================
-- Migration 007: Project Scheduling & Platforms Configuration
-- ============================================================

-- 1. Add platforms (text array) and schedule_frequency columns
ALTER TABLE public.projects 
  ADD COLUMN platforms TEXT[] NOT NULL DEFAULT ARRAY['chatgpt', 'gemini'],
  ADD COLUMN schedule_frequency TEXT NOT NULL DEFAULT 'four_times_daily';

-- 2. Add check constraint on schedule_frequency
ALTER TABLE public.projects
  ADD CONSTRAINT check_schedule_frequency 
  CHECK (schedule_frequency IN ('paused', 'daily', 'twice_daily', 'four_times_daily', 'weekly'));
