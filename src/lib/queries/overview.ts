import { createClient } from '@/lib/supabase/server'

export interface ExecutiveKPIs {
  visibilityScore: number
  visibilityDelta: number
  shareOfVoice: number
  shareOfVoiceDelta: number
  avgPosition: number | null
  avgPositionDelta: number | null
  citationRate: number
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
  promptCount: number
}

export interface VisibilityTrendPoint {
  date: string
  score: number
}

export interface PlatformBreakdownRow {
  platform: string
  visibilityScore: number
  mentionRate: number
  avgPosition: number | null
  citationCount: number
}

export async function getExecutiveKPIs(projectId: string): Promise<ExecutiveKPIs> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  const brandId = primaryBrand?.id ?? null

  const [
    { data: todayScores },
    { data: thirtyDaysAgoScores },
    { data: mentionData },
    sentimentResult,
    { data: citationData },
    { data: promptData },
  ] = await Promise.all([
    supabase
      .from('visibility_scores')
      .select('total_score, platform')
      .eq('project_id', projectId)
      .eq('date', today)
      .not('brand_id', 'is', null),
    supabase
      .from('visibility_scores')
      .select('total_score, platform')
      .eq('project_id', projectId)
      .eq('date', thirtyDaysAgo)
      .not('brand_id', 'is', null),
    supabase
      .from('mentions')
      .select('mentioned, brand_id, run_id')
      .not('brand_id', 'is', null),
    brandId
      ? supabase.rpc('get_sentiment_breakdown', {
          p_project_id: projectId,
          p_date: today,
          p_brand_id: brandId,
        })
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('citations')
      .select('brand_id')
      .eq('brand_id', brandId ?? ''),
    supabase
      .from('prompts')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_active', true),
  ])

  const avgScore = (scores: Array<{ total_score: number | null }>) => {
    if (!scores || scores.length === 0) return 0
    const valid = scores.filter((s) => s.total_score !== null)
    if (valid.length === 0) return 0
    return Math.round(valid.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / valid.length)
  }

  const currentScore = avgScore(todayScores ?? [])
  const previousScore = avgScore(thirtyDaysAgoScores ?? [])

  // Share of voice: own brand mentions / total mentions
  const totalMentions = (mentionData ?? []).filter((m) => m.mentioned).length
  const ownMentions = (mentionData ?? []).filter((m) => m.mentioned && m.brand_id === brandId).length
  const shareOfVoice = totalMentions > 0 ? Math.round((ownMentions / totalMentions) * 100) : 0

  // Sentiment breakdown
  let sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 }
  if (sentimentResult.data && typeof sentimentResult.data === 'object') {
    const sd = sentimentResult.data as Record<string, unknown>
    sentimentBreakdown = {
      positive: typeof sd.positive === 'number' ? sd.positive : 0,
      neutral: typeof sd.neutral === 'number' ? sd.neutral : 0,
      negative: typeof sd.negative === 'number' ? sd.negative : 0,
    }
  }

  const promptCount = promptData?.length ?? 0
  const citationRate =
    promptCount > 0
      ? Math.round(((citationData?.length ?? 0) / promptCount) * 100)
      : 0

  return {
    visibilityScore: currentScore,
    visibilityDelta: currentScore - previousScore,
    shareOfVoice,
    shareOfVoiceDelta: 0, // would need 30d-ago share to compute
    avgPosition: null, // computed from get_avg_position RPC if needed
    avgPositionDelta: null,
    citationRate,
    sentimentBreakdown,
    promptCount,
  }
}

export async function getVisibilityTrend(
  projectId: string,
  days = 30
): Promise<VisibilityTrendPoint[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  if (!primaryBrand) return []

  const { data: scores } = await supabase
    .from('visibility_scores')
    .select('date, total_score')
    .eq('project_id', projectId)
    .eq('brand_id', primaryBrand.id)
    .gte('date', since)
    .order('date', { ascending: true })

  if (!scores) return []

  // Average across platforms per date
  const byDate = new Map<string, number[]>()
  for (const s of scores) {
    if (s.total_score !== null) {
      const existing = byDate.get(s.date) ?? []
      existing.push(s.total_score)
      byDate.set(s.date, existing)
    }
  }

  return Array.from(byDate.entries()).map(([date, vals]) => ({
    date,
    score: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  }))
}

export async function getPlatformBreakdown(projectId: string): Promise<PlatformBreakdownRow[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  if (!primaryBrand) return []

  const { data: scores } = await supabase
    .from('visibility_scores')
    .select('platform, total_score, mention_score, position_score, prompt_count')
    .eq('project_id', projectId)
    .eq('brand_id', primaryBrand.id)
    .eq('date', today)

  if (!scores || scores.length === 0) return []

  const { data: citations } = await supabase
    .from('citations')
    .select('run_id, brand_id')
    .eq('brand_id', primaryBrand.id)

  const { data: runs } = await supabase
    .from('runs')
    .select('id, platform')
    .in(
      'prompt_id',
      (
        await supabase
          .from('prompts')
          .select('id')
          .eq('project_id', projectId)
      ).data?.map((p) => p.id) ?? []
    )
    .gte('run_date', `${today}T00:00:00`)
    .lt('run_date', `${today}T23:59:59`)
    .eq('status', 'success')

  const citationsByPlatform: Record<string, number> = {}
  for (const c of citations ?? []) {
    const run = (runs ?? []).find((r) => r.id === c.run_id)
    if (run) {
      citationsByPlatform[run.platform] = (citationsByPlatform[run.platform] ?? 0) + 1
    }
  }

  return scores.map((s) => ({
    platform: s.platform,
    visibilityScore: Math.round(s.total_score ?? 0),
    mentionRate: Math.round((s.mention_score ?? 0)),
    avgPosition: s.position_score !== null ? Math.round(s.position_score) : null,
    citationCount: citationsByPlatform[s.platform] ?? 0,
  }))
}
