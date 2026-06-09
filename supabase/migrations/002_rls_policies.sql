-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.owns_project(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = auth.uid()
  )
$$;

-- ============================================================
-- user_profiles policies
-- ============================================================

CREATE POLICY "users_select_own_profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- projects policies
-- ============================================================

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND public.get_user_role() = 'admin'
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid() AND public.get_user_role() = 'admin'
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (
    owner_id = auth.uid() AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- brands policies
-- ============================================================

CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (public.owns_project(project_id));

CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "brands_delete" ON public.brands
  FOR DELETE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- competitors policies (same pattern as brands)
-- ============================================================

CREATE POLICY "competitors_select" ON public.competitors
  FOR SELECT USING (public.owns_project(project_id));

CREATE POLICY "competitors_insert" ON public.competitors
  FOR INSERT WITH CHECK (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "competitors_update" ON public.competitors
  FOR UPDATE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "competitors_delete" ON public.competitors
  FOR DELETE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- prompts policies
-- ============================================================

CREATE POLICY "prompts_select" ON public.prompts
  FOR SELECT USING (public.owns_project(project_id));

CREATE POLICY "prompts_insert" ON public.prompts
  FOR INSERT WITH CHECK (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "prompts_update" ON public.prompts
  FOR UPDATE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

CREATE POLICY "prompts_delete" ON public.prompts
  FOR DELETE USING (
    public.owns_project(project_id) AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- runs policies (read-only for authenticated users who own the project)
-- Writes happen only via service-role client (cron jobs)
-- ============================================================

CREATE POLICY "runs_select" ON public.runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts pr
      WHERE pr.id = prompt_id AND public.owns_project(pr.project_id)
    )
  );

-- ============================================================
-- mentions policies
-- ============================================================

CREATE POLICY "mentions_select" ON public.mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runs r
      JOIN public.prompts pr ON pr.id = r.prompt_id
      WHERE r.id = run_id AND public.owns_project(pr.project_id)
    )
  );

-- ============================================================
-- citations policies
-- ============================================================

CREATE POLICY "citations_select" ON public.citations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.runs r
      JOIN public.prompts pr ON pr.id = r.prompt_id
      WHERE r.id = run_id AND public.owns_project(pr.project_id)
    )
  );

-- ============================================================
-- visibility_scores policies
-- ============================================================

CREATE POLICY "visibility_scores_select" ON public.visibility_scores
  FOR SELECT USING (public.owns_project(project_id));
