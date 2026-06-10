-- ============================================================
-- Migration 009: Project Members
-- Allows admins to add existing users to specific projects
-- ============================================================

CREATE TABLE public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id    ON public.project_members(user_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- A user can see their own membership rows; admins see all via service role (bypasses RLS).
-- Do NOT query public.projects here — projects_select already queries project_members,
-- so a back-reference creates infinite recursion.
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- Update owns_project() to include project_members
-- owns_project() is SECURITY DEFINER so it bypasses RLS when
-- querying project_members — no recursion risk.
-- ============================================================

CREATE OR REPLACE FUNCTION public.owns_project(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  )
$$;

-- ============================================================
-- Update projects_select policy to include members
-- ============================================================

DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = id AND user_id = auth.uid()
    )
  );
