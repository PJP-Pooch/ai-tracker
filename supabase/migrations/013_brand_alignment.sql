-- ============================================================
-- Migration 013: Brand Alignment Check
-- ============================================================

-- 1. Add brand intelligence columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS brand_positioning TEXT,
  ADD COLUMN IF NOT EXISTS alignment_check_mode TEXT NOT NULL DEFAULT 'off'
    CHECK (alignment_check_mode IN ('off', 'manual', 'auto'));

-- 2. Brand alignment results table (one row per run)
CREATE TABLE IF NOT EXISTS public.run_brand_alignment (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'checking', 'done', 'failed')),
  overall_verdict  TEXT CHECK (overall_verdict IN ('aligned', 'contradicted', 'mixed', 'unchecked')),
  brand_brief_snapshot TEXT,
  claims           JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message    TEXT,
  checked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id)
);

CREATE INDEX IF NOT EXISTS idx_run_brand_alignment_run_id ON public.run_brand_alignment(run_id);
CREATE INDEX IF NOT EXISTS idx_run_brand_alignment_verdict ON public.run_brand_alignment(overall_verdict);

-- 3. RLS
ALTER TABLE public.run_brand_alignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "run_brand_alignment_select" ON public.run_brand_alignment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runs r
      JOIN public.prompts p ON r.prompt_id = p.id
      WHERE r.id = run_brand_alignment.run_id
        AND public.owns_project(p.project_id)
    )
  );

CREATE POLICY "run_brand_alignment_insert" ON public.run_brand_alignment
  FOR INSERT WITH CHECK (true);

CREATE POLICY "run_brand_alignment_update" ON public.run_brand_alignment
  FOR UPDATE USING (true);
