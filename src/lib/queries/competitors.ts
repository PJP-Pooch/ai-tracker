import { createClient } from '@/lib/supabase/server'

export interface VisibilityTrendPoint {
  date: string
  [brandName: string]: number | string
}

export interface CompetitorScore {
  brandId: string
  brandName: string
  domain: string
  isOwn: boolean
  currentScore: number
  previousScore: number
  delta: number
  promptCoverage: number
  citationCount: number
  trendData: Array<{ date: string; score: number }>
}

export async function getCompetitorVisibility(
  projectId: string,
  days = 30,
  platform?: string
): Promise<CompetitorScore[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [{ data: brands }, { data: competitors }, { data: scores }, { data: citations }] =
    await Promise.all([
      supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
      supabase.from('competitors').select('id, name, domain').eq('project_id', projectId),
      supabase
        .from('visibility_scores')
        .select('brand_id, date, platform, total_score')
        .eq('project_id', projectId)
        .gte('date', since)
        .order('date', { ascending: true }),
      supabase
        .from('citations')
        .select('brand_id')
        .not('brand_id', 'is', null),
    ])

  // Build unified brand list from brands + competitors tracked as brands
  const allBrands = [
    ...(brands ?? []).map((b) => ({ ...b, isOwn: b.is_primary })),
  ]

  return allBrands.map((brand) => {
    const brandScores = (scores ?? []).filter(
      (s) =>
        s.brand_id === brand.id &&
        (platform ? s.platform === platform : true)
    )

    const trendData = brandScores.map((s) => ({
      date: s.date,
      score: s.total_score ?? 0,
    }))

    // Latest score vs 7-days-ago score
    const latestScore = brandScores
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.total_score ?? 0), 0) /
      Math.max(1, brandScores.filter((s) => s.date === today).length)

    const previousScore = brandScores
      .filter((s) => s.date === sevenDaysAgo)
      .reduce((sum, s) => sum + (s.total_score ?? 0), 0) /
      Math.max(1, brandScores.filter((s) => s.date === sevenDaysAgo).length)

    const citationCount = (citations ?? []).filter(
      (c) => c.brand_id === brand.id
    ).length

    return {
      brandId: brand.id,
      brandName: brand.name,
      domain: brand.domain,
      isOwn: brand.isOwn,
      currentScore: Math.round(latestScore),
      previousScore: Math.round(previousScore),
      delta: Math.round(latestScore - previousScore),
      promptCoverage: 0, // computed below if needed
      citationCount,
      trendData,
    }
  })
}

export async function getShareOfVoice(
  projectId: string,
  date?: string
): Promise<Array<{ name: string; share: number; isOwn: boolean }>> {
  const supabase = await createClient()
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  const [{ data: brands }, { data: runs }] = await Promise.all([
    supabase.from('brands').select('id, name, is_primary').eq('project_id', projectId),
    supabase
      .from('runs')
      .select(`
        id,
        mentions ( brand_id, mentioned )
      `)
      .in(
        'prompt_id',
        (await supabase.from('prompts').select('id').eq('project_id', projectId)).data?.map(
          (p) => p.id
        ) ?? []
      )
      .gte('run_date', `${targetDate}T00:00:00`)
      .lt('run_date', `${targetDate}T23:59:59`)
      .eq('status', 'success'),
  ])

  if (!brands || !runs) return []

  const mentionCounts: Record<string, number> = {}
  for (const run of runs) {
    for (const mention of run.mentions ?? []) {
      if (mention.mentioned && mention.brand_id) {
        mentionCounts[mention.brand_id] = (mentionCounts[mention.brand_id] ?? 0) + 1
      }
    }
  }

  const total = Object.values(mentionCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return brands
    .filter((b) => mentionCounts[b.id] > 0)
    .map((b) => ({
      name: b.name,
      share: Math.round((mentionCounts[b.id] / total) * 100),
      isOwn: b.is_primary,
    }))
    .sort((a, b) => b.share - a.share)
}
