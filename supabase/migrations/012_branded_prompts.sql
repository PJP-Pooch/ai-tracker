-- ============================================================
-- Migration 012: Branded / Non-Branded Prompt Classification
-- ============================================================

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS is_branded BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_prompts_is_branded ON public.prompts(is_branded);

-- Backfill: mark existing prompts as branded if they contain the primary brand name
-- Handles both "Brand & Name" and "Brand and Name" variants (case-insensitive)
UPDATE public.prompts p
SET is_branded = TRUE
FROM public.brands b
WHERE b.project_id = p.project_id
  AND b.is_primary = TRUE
  AND (
    LOWER(p.prompt_text) LIKE '%' || LOWER(b.name) || '%'
    OR LOWER(p.prompt_text) LIKE '%' || LOWER(REPLACE(b.name, '&', 'and')) || '%'
    OR LOWER(p.prompt_text) LIKE '%' || LOWER(REPLACE(b.name, 'and', '&')) || '%'
  );
