-- ============================================================
-- Migration 018: Brand Critique Prompts
-- ============================================================

-- 1. Add is_critique column to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_critique BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_prompts_is_critique ON public.prompts(is_critique);

-- 3. Recreate compute_visibility_score to exclude critique prompts
CREATE OR REPLACE FUNCTION public.compute_visibility_score(
  p_project_id UUID,
  p_brand_id   UUID,
  p_date       DATE,
  p_platform   TEXT,
  p_category   TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mention_score   NUMERIC;
  v_position_score  NUMERIC;
  v_citation_score  NUMERIC;
  v_sentiment_score NUMERIC;
  v_total           NUMERIC;
BEGIN
  -- Mention score: % of runs where brand was mentioned (filtered by category if specified, excluding critique prompts)
  SELECT COALESCE(
    100.0 * COUNT(*) FILTER (WHERE m.mentioned = TRUE) /
    NULLIF(COUNT(DISTINCT r.id), 0),
    0
  ) INTO v_mention_score
  FROM public.runs r
  JOIN public.prompts pr ON r.prompt_id = pr.id
  LEFT JOIN public.mentions m ON m.run_id = r.id AND m.brand_id = p_brand_id
  WHERE pr.project_id = p_project_id
    AND r.platform = p_platform
    AND DATE(r.run_date) = p_date
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_category IS NULL OR pr.category = p_category);

  -- Position score: weighted avg (1st=100, 2nd=80, 3rd=60, 4th=40, 5th=20, 6th+=10)
  SELECT COALESCE(AVG(
    CASE m.position
      WHEN 1 THEN 100
      WHEN 2 THEN 80
      WHEN 3 THEN 60
      WHEN 4 THEN 40
      WHEN 5 THEN 20
      ELSE 10
    END
  ), 0) INTO v_position_score
  FROM public.mentions m
  JOIN public.runs r ON m.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  WHERE pr.project_id = p_project_id
    AND m.brand_id = p_brand_id
    AND r.platform = p_platform
    AND DATE(r.run_date) = p_date
    AND m.mentioned = TRUE
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_category IS NULL OR pr.category = p_category);

  -- Citation score: % of runs where brand's domain was cited
  SELECT COALESCE(
    100.0 * COUNT(DISTINCT c.run_id) /
    NULLIF(COUNT(DISTINCT r.id), 0),
    0
  ) INTO v_citation_score
  FROM public.runs r
  JOIN public.prompts pr ON r.prompt_id = pr.id
  LEFT JOIN public.citations c ON c.run_id = r.id AND c.brand_id = p_brand_id
  WHERE pr.project_id = p_project_id
    AND r.platform = p_platform
    AND DATE(r.run_date) = p_date
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_category IS NULL OR pr.category = p_category);

  -- Sentiment score: weighted (positive=100, neutral=50, negative=0)
  SELECT COALESCE(AVG(
    CASE m.sentiment
      WHEN 'positive' THEN 100
      WHEN 'neutral'  THEN 50
      WHEN 'negative' THEN 0
      ELSE 50
    END
  ), 50) INTO v_sentiment_score
  FROM public.mentions m
  JOIN public.runs r ON m.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  WHERE pr.project_id = p_project_id
    AND m.brand_id = p_brand_id
    AND r.platform = p_platform
    AND DATE(r.run_date) = p_date
    AND m.mentioned = TRUE
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_category IS NULL OR pr.category = p_category);

  v_total :=
    (v_mention_score * 0.40) +
    (v_position_score * 0.30) +
    (v_citation_score * 0.20) +
    (v_sentiment_score * 0.10);

  RETURN ROUND(v_total, 2);
END;
$$;

-- 4. Recreate get_mention_rate to exclude critique prompts
CREATE OR REPLACE FUNCTION public.get_mention_rate(
  p_project_id UUID,
  p_date       DATE,
  p_brand_id   UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_rate NUMERIC;
BEGIN
  SELECT COALESCE(
    100.0 * COUNT(*) FILTER (WHERE m.mentioned = TRUE) /
    NULLIF(COUNT(DISTINCT r.id), 0),
    0
  ) INTO v_rate
  FROM public.runs r
  JOIN public.prompts pr ON r.prompt_id = pr.id
  LEFT JOIN public.mentions m ON m.run_id = r.id
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
  WHERE pr.project_id = p_project_id
    AND DATE(r.run_date) = p_date
    AND r.status = 'success'
    AND pr.is_critique = FALSE;

  RETURN ROUND(v_rate, 2);
END;
$$;

-- 5. Recreate get_avg_position to exclude critique prompts
CREATE OR REPLACE FUNCTION public.get_avg_position(
  p_project_id UUID,
  p_date       DATE,
  p_brand_id   UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_avg NUMERIC;
BEGIN
  SELECT COALESCE(AVG(m.position::NUMERIC), 0) INTO v_avg
  FROM public.mentions m
  JOIN public.runs r ON m.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  WHERE pr.project_id = p_project_id
    AND DATE(r.run_date) = p_date
    AND m.mentioned = TRUE
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id);

  RETURN ROUND(v_avg, 2);
END;
$$;

-- 6. Recreate get_sentiment_breakdown to exclude critique prompts
CREATE OR REPLACE FUNCTION public.get_sentiment_breakdown(
  p_project_id UUID,
  p_date       DATE,
  p_brand_id   UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_positive INTEGER;
  v_neutral  INTEGER;
  v_negative INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE m.sentiment = 'positive'),
    COUNT(*) FILTER (WHERE m.sentiment = 'neutral'),
    COUNT(*) FILTER (WHERE m.sentiment = 'negative')
  INTO v_positive, v_neutral, v_negative
  FROM public.mentions m
  JOIN public.runs r ON m.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  WHERE pr.project_id = p_project_id
    AND DATE(r.run_date) = p_date
    AND m.mentioned = TRUE
    AND r.status = 'success'
    AND pr.is_critique = FALSE
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id);

  RETURN json_build_object(
    'positive', COALESCE(v_positive, 0),
    'neutral',  COALESCE(v_neutral, 0),
    'negative', COALESCE(v_negative, 0)
  );
END;
$$;
