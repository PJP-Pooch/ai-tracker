-- Migration 011: Add last_seen to get_top_cited_domains and get_top_cited_urls

-- Drop existing functions to allow changing the return table signature
DROP FUNCTION IF EXISTS public.get_top_cited_domains(UUID, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_top_cited_urls(UUID, TEXT, TEXT, INTEGER);

-- Recreate get_top_cited_domains with last_seen column
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
  competitor_name TEXT,
  last_seen       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.owns_project(p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.domain,
    COUNT(*)::BIGINT AS citation_count,
    COUNT(DISTINCT c.run_id)::BIGINT AS run_count,
    MAX(b.name) AS brand_name,
    MAX(comp.name) AS competitor_name,
    MAX(r.run_date) AS last_seen
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

-- Recreate get_top_cited_urls with last_seen column
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
  competitor_name TEXT,
  last_seen       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.owns_project(p_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.url,
    c.domain,
    MAX(c.title) AS title,
    COUNT(*)::BIGINT AS citation_count,
    MAX(b.name) AS brand_name,
    MAX(comp.name) AS competitor_name,
    MAX(r.run_date) AS last_seen
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
