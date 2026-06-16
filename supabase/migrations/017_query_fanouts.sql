-- ============================================================
-- Migration 017: Query Fanouts Table
-- ============================================================

CREATE TABLE public.query_fanouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  rank_group    INTEGER,
  rank_absolute INTEGER,
  ranked_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT query_fanouts_run_id_query_key UNIQUE (run_id, query)
);

-- Indexes for performance
CREATE INDEX idx_query_fanouts_run_id ON public.query_fanouts(run_id);

-- Enable RLS
ALTER TABLE public.query_fanouts ENABLE ROW LEVEL SECURITY;

-- Select Policy (read-only for members of the project)
CREATE POLICY "query_fanouts_select" ON public.query_fanouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runs r
      JOIN public.prompts pr ON pr.id = r.prompt_id
      WHERE r.id = run_id AND public.owns_project(pr.project_id)
    )
  );
