import { createClient } from '@/lib/supabase/server'
import { mentionedInResponse } from '@/lib/queries/competitors'

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
  lastScanned: string | null
}

export interface VisibilityTrendPoint {
  date: string
  score: number
  [key: string]: number | string
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  const brandId = primaryBrand?.id ?? null

  // Fetch all prompts for the project
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_active', true)

  const promptIds = (prompts ?? []).map((p) => p.id)
  const promptCount = promptIds.length

  if (promptCount === 0 || !brandId) {
    return {
      visibilityScore: 0, visibilityDelta: 0,
      shareOfVoice: 0, shareOfVoiceDelta: 0,
      avgPosition: null, avgPositionDelta: null,
      citationRate: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      promptCount,
      lastScanned: null,
    }
  }

  // Fetch all successful runs for these prompts
  const { data: runs } = await supabase
    .from('runs')
    .select('id, platform')
    .in('prompt_id', promptIds)
    .eq('status', 'success')

  const runIds = (runs ?? []).map((r) => r.id)

  if (runIds.length === 0) {
    return {
      visibilityScore: 0, visibilityDelta: 0,
      shareOfVoice: 0, shareOfVoiceDelta: 0,
      avgPosition: null, avgPositionDelta: null,
      citationRate: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      promptCount,
      lastScanned: null,
    }
  }

  // Fetch all mentions and citations for those runs in parallel
  const [{ data: allMentions }, { data: allCitations }, { data: recentRuns }] = await Promise.all([
    supabase
      .from('mentions')
      .select('run_id, brand_id, mentioned, position, sentiment')
      .in('run_id', runIds),
    supabase
      .from('citations')
      .select('run_id, brand_id')
      .in('run_id', runIds),
    // Last 30 days for delta comparison
    supabase
      .from('runs')
      .select('id')
      .in('prompt_id', promptIds)
      .eq('status', 'success')
      .gte('run_date', thirtyDaysAgo),
  ])

  const mentions = allMentions ?? []
  const citations = allCitations ?? []

  // Share of voice: own brand mentions / total brand mentions
  const totalMentioned = mentions.filter((m) => m.mentioned).length
  const ownMentioned = mentions.filter((m) => m.mentioned && m.brand_id === brandId).length
  const shareOfVoice = totalMentioned > 0 ? Math.round((ownMentioned / totalMentioned) * 100) : 0

  // Visibility score: % of runs where own brand was mentioned
  const visibilityScore = runIds.length > 0
    ? Math.round((ownMentioned / runIds.length) * 100)
    : 0

  // Avg position: average position across runs where brand was mentioned
  const positionedMentions = mentions.filter(
    (m) => m.mentioned && m.brand_id === brandId && m.position !== null
  )
  const avgPosition = positionedMentions.length > 0
    ? Math.round(
        positionedMentions.reduce((sum, m) => sum + (m.position ?? 0), 0) / positionedMentions.length
      )
    : null

  // Citation rate: % of runs where own brand's domain was cited
  const ownCitationRunIds = new Set(
    citations.filter((c) => c.brand_id === brandId).map((c) => c.run_id)
  )
  const citationRate = runIds.length > 0
    ? Math.round((ownCitationRunIds.size / runIds.length) * 100)
    : 0

  // Sentiment breakdown from own brand mentions
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 }
  for (const m of mentions.filter((m) => m.mentioned && m.brand_id === brandId)) {
    if (m.sentiment === 'positive') sentimentBreakdown.positive++
    else if (m.sentiment === 'negative') sentimentBreakdown.negative++
    else sentimentBreakdown.neutral++
  }

  // Fetch latest successful run date for these prompts
  const { data: latestRun } = await supabase
    .from('runs')
    .select('run_date')
    .in('prompt_id', promptIds)
    .eq('status', 'success')
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastScanned = latestRun?.run_date ?? null

  return {
    visibilityScore,
    visibilityDelta: 0,
    shareOfVoice,
    shareOfVoiceDelta: 0,
    avgPosition,
    avgPositionDelta: null,
    citationRate,
    sentimentBreakdown,
    promptCount,
    lastScanned,
  }
}

export async function getVisibilityTrend(
  projectId: string,
  days = 30
): Promise<VisibilityTrendPoint[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: primaryBrand }, { data: competitors }] = await Promise.all([
    supabase
      .from('brands')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .single(),
    supabase
      .from('competitors')
      .select('name, domain')
      .eq('project_id', projectId),
  ])

  if (!primaryBrand) return []

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id')
    .eq('project_id', projectId)

  const promptIds = (prompts ?? []).map((p) => p.id)
  if (promptIds.length === 0) return []

  // Get runs with their mentions for the brand and raw response for competitor parsing
  const { data: runs } = await supabase
    .from('runs')
    .select('id, run_date, raw_response, mentions(brand_id, mentioned)')
    .in('prompt_id', promptIds)
    .eq('status', 'success')
    .gte('run_date', since)
    .order('run_date', { ascending: true })

  if (!runs || runs.length === 0) return []

  // Group runs by date, compute % mentioned per day for own brand and competitors
  const byDate = new Map<
    string,
    { total: number; ownMentioned: number; competitorMentioned: Record<string, number> }
  >()
  for (const run of runs) {
    const date = run.run_date.split('T')[0]
    const entry = byDate.get(date) ?? { total: 0, ownMentioned: 0, competitorMentioned: {} }
    entry.total++

    const wasMentioned = (run.mentions as Array<{ brand_id: string; mentioned: boolean }>)
      .some((m) => m.brand_id === primaryBrand.id && m.mentioned)
    if (wasMentioned) entry.ownMentioned++

    if (competitors && competitors.length > 0 && run.raw_response) {
      for (const comp of competitors) {
        if (mentionedInResponse(run.raw_response, comp.name, comp.domain)) {
          entry.competitorMentioned[comp.name] = (entry.competitorMentioned[comp.name] ?? 0) + 1
        }
      }
    }

    byDate.set(date, entry)
  }

  return Array.from(byDate.entries()).map(([date, { total, ownMentioned, competitorMentioned }]) => {
    const point: VisibilityTrendPoint = {
      date,
      score: total > 0 ? Math.round((ownMentioned / total) * 100) : 0,
    }

    if (competitors) {
      for (const comp of competitors) {
        const count = competitorMentioned[comp.name] ?? 0
        point[comp.name] = total > 0 ? Math.round((count / total) * 100) : 0
      }
    }

    return point
  })
}

export async function getPlatformBreakdown(projectId: string): Promise<PlatformBreakdownRow[]> {
  const supabase = await createClient()

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  if (!primaryBrand) return []

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id')
    .eq('project_id', projectId)

  const promptIds = (prompts ?? []).map((p) => p.id)
  if (promptIds.length === 0) return []

  const { data: runs } = await supabase
    .from('runs')
    .select('id, platform, mentions(brand_id, mentioned, position), citations(brand_id)')
    .in('prompt_id', promptIds)
    .eq('status', 'success')

  if (!runs || runs.length === 0) return []

  const platforms = ['chatgpt', 'gemini']
  return platforms.map((platform) => {
    const platformRuns = runs.filter((r) => r.platform === platform)
    const mentions = platformRuns.flatMap(
      (r) => r.mentions as Array<{ brand_id: string; mentioned: boolean; position: number | null }>
    )
    const ownMentions = mentions.filter((m) => m.brand_id === primaryBrand.id && m.mentioned)
    const positioned = ownMentions.filter((m) => m.position !== null)

    const citationRunIds = new Set(
      platformRuns
        .filter((r) =>
          (r.citations as Array<{ brand_id: string }>).some((c) => c.brand_id === primaryBrand.id)
        )
        .map((r) => r.id)
    )

    const mentionRate = platformRuns.length > 0
      ? Math.round((ownMentions.length / platformRuns.length) * 100)
      : 0

    const avgPos = positioned.length > 0
      ? Math.round(positioned.reduce((s, m) => s + (m.position ?? 0), 0) / positioned.length)
      : null

    return {
      platform,
      visibilityScore: mentionRate,
      mentionRate,
      avgPosition: avgPos,
      citationCount: citationRunIds.size,
    }
  })
}

export interface IntentVisibility {
  intent: 'informational' | 'commercial' | 'transactional'
  visibilityScore: number
  promptCount: number
}

export async function getIntentVisibility(projectId: string): Promise<IntentVisibility[]> {
  const supabase = await createClient()

  const { data: primaryBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single()

  if (!primaryBrand) return []

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, intent')
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (!prompts || prompts.length === 0) return []

  const promptIds = prompts.map((p) => p.id)

  const { data: runs } = await supabase
    .from('runs')
    .select('id, prompt_id, mentions(brand_id, mentioned)')
    .in('prompt_id', promptIds)
    .eq('status', 'success')

  if (!runs || runs.length === 0) {
    const intents: Array<'informational' | 'commercial' | 'transactional'> = ['informational', 'commercial', 'transactional']
    return intents.map((intent) => ({
      intent,
      visibilityScore: 0,
      promptCount: prompts.filter((p) => (p.intent ?? 'informational') === intent).length,
    }))
  }

  // Create prompt to intent map
  const promptIntentMap = new Map<string, 'informational' | 'commercial' | 'transactional'>()
  for (const p of prompts) {
    promptIntentMap.set(p.id, (p.intent ?? 'informational') as 'informational' | 'commercial' | 'transactional')
  }

  // Group runs by intent and calculate mention count
  const stats = {
    informational: { total: 0, mentioned: 0 },
    commercial: { total: 0, mentioned: 0 },
    transactional: { total: 0, mentioned: 0 },
  }

  for (const run of runs) {
    const intent = promptIntentMap.get(run.prompt_id)
    if (!intent || !stats[intent]) continue

    stats[intent].total++
    const wasMentioned = (run.mentions as Array<{ brand_id: string; mentioned: boolean }>)
      ?.some((m) => m.brand_id === primaryBrand.id && m.mentioned)

    if (wasMentioned) {
      stats[intent].mentioned++
    }
  }

  const intents: Array<'informational' | 'commercial' | 'transactional'> = ['informational', 'commercial', 'transactional']
  return intents.map((intent) => {
    const total = stats[intent].total
    const mentioned = stats[intent].mentioned
    const score = total > 0 ? Math.round((mentioned / total) * 100) : 0
    return {
      intent,
      visibilityScore: score,
      promptCount: prompts.filter((p) => (p.intent ?? 'informational') === intent).length,
    }
  })
}
