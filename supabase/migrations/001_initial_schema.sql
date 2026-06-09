-- ============================================================
-- Migration 001: Core Tables
-- ============================================================

-- User profiles (mirrors auth.users, adds role)
CREATE TABLE public.user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst')),
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands (own brand has is_primary = true)
CREATE TABLE public.brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors
CREATE TABLE public.competitors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts (tracked search queries)
CREATE TABLE public.prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  volume      INTEGER DEFAULT 0,
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Runs (one per prompt × platform × cron slot)
CREATE TABLE public.runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id     UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('chatgpt', 'gemini')),
  model_name    TEXT,
  run_date      TIMESTAMPTZ DEFAULT NOW(),
  raw_response  TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  error_message TEXT,
  cost_usd      NUMERIC(10,6),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Mentions (brand appearances within a run's response)
CREATE TABLE public.mentions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  brand_id   UUID REFERENCES public.brands(id),
  position   INTEGER,
  sentiment  TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  mentioned  BOOLEAN DEFAULT TRUE,
  snippet    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citations (URLs referenced in the AI response)
CREATE TABLE public.citations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,
  url           TEXT NOT NULL,
  title         TEXT,
  snippet       TEXT,
  brand_id      UUID REFERENCES public.brands(id),
  competitor_id UUID REFERENCES public.competitors(id),
  position      INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Visibility scores (pre-computed daily rollups)
CREATE TABLE public.visibility_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  brand_id       UUID REFERENCES public.brands(id),
  date           DATE NOT NULL,
  platform       TEXT NOT NULL,
  mention_score  NUMERIC(5,2),
  position_score NUMERIC(5,2),
  citation_score NUMERIC(5,2),
  sentiment_score NUMERIC(5,2),
  total_score    NUMERIC(5,2),
  prompt_count   INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, brand_id, date, platform)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_runs_prompt_id        ON public.runs(prompt_id);
CREATE INDEX idx_runs_run_date         ON public.runs(run_date DESC);
CREATE INDEX idx_runs_platform         ON public.runs(platform);
CREATE INDEX idx_runs_status           ON public.runs(status);
CREATE INDEX idx_mentions_run_id       ON public.mentions(run_id);
CREATE INDEX idx_mentions_brand_id     ON public.mentions(brand_id);
CREATE INDEX idx_mentions_mentioned    ON public.mentions(mentioned);
CREATE INDEX idx_citations_run_id      ON public.citations(run_id);
CREATE INDEX idx_citations_domain      ON public.citations(domain);
CREATE INDEX idx_citations_brand_id    ON public.citations(brand_id);
CREATE INDEX idx_citations_competitor_id ON public.citations(competitor_id);
CREATE INDEX idx_prompts_project_id    ON public.prompts(project_id);
CREATE INDEX idx_prompts_is_active     ON public.prompts(is_active);
CREATE INDEX idx_brands_project_id     ON public.brands(project_id);
CREATE INDEX idx_competitors_project_id ON public.competitors(project_id);
CREATE INDEX idx_visibility_scores_project_date ON public.visibility_scores(project_id, date DESC);
CREATE INDEX idx_visibility_scores_brand_date   ON public.visibility_scores(brand_id, date DESC);
