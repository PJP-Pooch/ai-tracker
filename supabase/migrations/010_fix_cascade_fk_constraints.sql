-- Fix FK constraints that block cascade project deletion.
-- When a project is deleted, brands/competitors cascade first, but mentions/citations
-- reference those brands/competitors without ON DELETE actions, causing FK violations
-- before the mentions/citations are deleted via the runs→prompts chain.

ALTER TABLE public.mentions
  DROP CONSTRAINT mentions_brand_id_fkey,
  ADD CONSTRAINT mentions_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

ALTER TABLE public.citations
  DROP CONSTRAINT citations_brand_id_fkey,
  ADD CONSTRAINT citations_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

ALTER TABLE public.citations
  DROP CONSTRAINT citations_competitor_id_fkey,
  ADD CONSTRAINT citations_competitor_id_fkey
    FOREIGN KEY (competitor_id) REFERENCES public.competitors(id) ON DELETE SET NULL;

ALTER TABLE public.visibility_scores
  DROP CONSTRAINT visibility_scores_brand_id_fkey,
  ADD CONSTRAINT visibility_scores_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;
