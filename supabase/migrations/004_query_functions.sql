-- ============================================================
-- Migration 004: Query Functions for Dashboards
-- ============================================================

-- ============================================================
-- Visibility Score Computation
-- Formula: (mention × 0.40) + (position × 0.30) + (citation × 0.20) + (sentiment × 0.10)
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_visibility_score(
  p_project_id UUID,
  p_brand_id   UUID,
  p_date       DATE,
  p_platform   TEXT
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
  -- Mention score: % of runs where brand was mentioned
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
    AND r.status = 'success';

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
    AND r.status = 'success';

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
    AND r.status = 'success';

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
    AND r.status = 'success';

  v_total :=
    (v_mention_score * 0.40) +
    (v_position_score * 0.30) +
    (v_citation_score * 0.20) +
    (v_sentiment_score * 0.10);

  RETURN ROUND(v_total, 2);
END;
$$;

-- ============================================================
-- Top Cited Domains
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_top_cited_domains(
  p_project_id UUID,
  p_platform   TEXT    DEFAULT NULL,
  p_date_from  TEXT    DEFAULT NULL,
  p_date_to    TEXT    DEFAULT NULL,
  p_limit      INTEGER DEFAULT 50
)
RETURNS TABLE (
  domain          TEXT,
  citation_count  BIGINT,
  run_count       BIGINT,
  brand_name      TEXT,
  competitor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enforce project ownership
  IF NOT public.owns_project(p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.domain,
    COUNT(*)::BIGINT AS citation_count,
    COUNT(DISTINCT c.run_id)::BIGINT AS run_count,
    MAX(b.name) AS brand_name,
    MAX(comp.name) AS competitor_name
  FROM public.citations c
  JOIN public.runs r ON c.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  LEFT JOIN public.brands b ON c.brand_id = b.id
  LEFT JOIN public.competitors comp ON c.competitor_id = comp.id
  WHERE pr.project_id = p_project_id
    AND r.status = 'success'
    AND (p_platform IS NULL OR r.platform = p_platform)
    AND (p_date_from IS NULL OR r.run_date >= p_date_from::TIMESTAMPTZ)
    AND (p_date_to IS NULL OR r.run_date <= p_date_to::TIMESTAMPTZ)
  GROUP BY c.domain
  ORDER BY citation_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- Top Cited URLs
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_top_cited_urls(
  p_project_id UUID,
  p_domain     TEXT    DEFAULT NULL,
  p_platform   TEXT    DEFAULT NULL,
  p_limit      INTEGER DEFAULT 50
)
RETURNS TABLE (
  url             TEXT,
  domain          TEXT,
  title           TEXT,
  citation_count  BIGINT,
  brand_name      TEXT,
  competitor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.owns_project(p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.url,
    c.domain,
    MAX(c.title) AS title,
    COUNT(*)::BIGINT AS citation_count,
    MAX(b.name) AS brand_name,
    MAX(comp.name) AS competitor_name
  FROM public.citations c
  JOIN public.runs r ON c.run_id = r.id
  JOIN public.prompts pr ON r.prompt_id = pr.id
  LEFT JOIN public.brands b ON c.brand_id = b.id
  LEFT JOIN public.competitors comp ON c.competitor_id = comp.id
  WHERE pr.project_id = p_project_id
    AND r.status = 'success'
    AND (p_domain IS NULL OR c.domain = p_domain)
    AND (p_platform IS NULL OR r.platform = p_platform)
  GROUP BY c.url, c.domain
  ORDER BY citation_count DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- Overview KPI Helpers
-- ============================================================

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
    AND r.status = 'success';

  RETURN ROUND(v_rate, 2);
END;
$$;

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
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id);

  RETURN ROUND(v_avg, 2);
END;
$$;

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
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id);

  RETURN json_build_object(
    'positive', COALESCE(v_positive, 0),
    'neutral',  COALESCE(v_neutral, 0),
    'negative', COALESCE(v_negative, 0)
  );
END;
$$;
