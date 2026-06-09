-- ============================================================
-- Migration 005: Fix RLS write policies
-- Remove get_user_role() = 'admin' requirement from all write
-- policies. Ownership of the project is sufficient authorization
-- for a single-user SaaS — no user_profiles row is needed.
-- ============================================================

-- projects
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- brands
DROP POLICY IF EXISTS "brands_insert" ON public.brands;
DROP POLICY IF EXISTS "brands_update" ON public.brands;
DROP POLICY IF EXISTS "brands_delete" ON public.brands;

CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (public.owns_project(project_id));

CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (public.owns_project(project_id));

CREATE POLICY "brands_delete" ON public.brands
  FOR DELETE USING (public.owns_project(project_id));

-- competitors
DROP POLICY IF EXISTS "competitors_insert" ON public.competitors;
DROP POLICY IF EXISTS "competitors_update" ON public.competitors;
DROP POLICY IF EXISTS "competitors_delete" ON public.competitors;

CREATE POLICY "competitors_insert" ON public.competitors
  FOR INSERT WITH CHECK (public.owns_project(project_id));

CREATE POLICY "competitors_update" ON public.competitors
  FOR UPDATE USING (public.owns_project(project_id));

CREATE POLICY "competitors_delete" ON public.competitors
  FOR DELETE USING (public.owns_project(project_id));

-- prompts
DROP POLICY IF EXISTS "prompts_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete" ON public.prompts;

CREATE POLICY "prompts_insert" ON public.prompts
  FOR INSERT WITH CHECK (public.owns_project(project_id));

CREATE POLICY "prompts_update" ON public.prompts
  FOR UPDATE USING (public.owns_project(project_id));

CREATE POLICY "prompts_delete" ON public.prompts
  FOR DELETE USING (public.owns_project(project_id));
