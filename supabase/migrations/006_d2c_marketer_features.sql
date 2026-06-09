-- ============================================================
-- Migration 006: D2C Marketer Features
-- ============================================================

-- 1. Add intent column to prompts
ALTER TABLE public.prompts 
  ADD COLUMN intent TEXT DEFAULT 'informational' 
  CHECK (intent IN ('informational', 'commercial', 'transactional'));

-- 2. Add mention_type column to mentions
ALTER TABLE public.mentions 
  ADD COLUMN mention_type TEXT DEFAULT 'mentioned_only' 
  CHECK (mention_type IN ('top_choice', 'recommended', 'mentioned_only'));

-- 3. Add indexes
CREATE INDEX idx_prompts_intent ON public.prompts(intent);
CREATE INDEX idx_mentions_mention_type ON public.mentions(mention_type);

-- 4. GEO Outreach Finder RPC
CREATE OR REPLACE FUNCTION public.get_geo_outreach_opportunities(
  p_project_id UUID
)
RETURNS TABLE (
  domain               TEXT,
  competitor_citations BIGINT,
  competitors_cited    TEXT,
  prompts_count        BIGINT,
  sample_url           TEXT,
  sample_prompt        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_primary_brand_id UUID;
BEGIN
  -- Enforce project ownership
  IF NOT public.owns_project(p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Find primary brand id
  SELECT id INTO v_primary_brand_id
  FROM public.brands
  WHERE project_id = p_project_id AND is_primary = TRUE
  LIMIT 1;

  RETURN QUERY
  WITH competitor_citations AS (
    SELECT 
      c.domain,
      c.url,
      c.competitor_id,
      comp.name AS competitor_name,
      pr.prompt_text,
      r.id AS run_id
    FROM public.citations c
    JOIN public.runs r ON c.run_id = r.id
    JOIN public.prompts pr ON r.prompt_id = pr.id
    JOIN public.competitors comp ON c.competitor_id = comp.id
    WHERE pr.project_id = p_project_id
      AND r.status = 'success'
  ),
  own_citations AS (
    SELECT DISTINCT c.domain
    FROM public.citations c
    JOIN public.runs r ON c.run_id = r.id
    JOIN public.prompts pr ON r.prompt_id = pr.id
    WHERE pr.project_id = p_project_id
      AND c.brand_id = v_primary_brand_id
      AND r.status = 'success'
  )
  SELECT 
    cc.domain,
    COUNT(cc.url)::BIGINT AS competitor_citations,
    string_agg(DISTINCT cc.competitor_name, ', ') AS competitors_cited,
    COUNT(DISTINCT cc.prompt_text)::BIGINT AS prompts_count,
    MAX(cc.url) AS sample_url,
    MAX(cc.prompt_text) AS sample_prompt
  FROM competitor_citations cc
  LEFT JOIN own_citations oc ON cc.domain = oc.domain
  WHERE oc.domain IS NULL
  GROUP BY cc.domain
  ORDER BY competitor_citations DESC;
END;
$$;
