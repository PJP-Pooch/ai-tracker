-- ============================================================
-- Migration 010: Fix infinite recursion in project_members RLS
-- ============================================================
-- Migration 009 created a circular dependency:
--   projects_select  → queries project_members
--   project_members_select → queries projects  ← cycle
-- PostgreSQL detects this and errors, so non-admin users saw no projects.
-- Fix: project_members_select no longer references public.projects.
-- Admins continue to use the service role which bypasses RLS entirely.
-- ============================================================

DROP POLICY IF EXISTS "project_members_select" ON public.project_members;

CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());
