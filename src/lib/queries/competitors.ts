import { createDbClient } from '@/lib/supabase/db'

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
  mentionCount: number
  trendData: Array<{ date: string; score: number }>
}

export function mentionedInResponse(text: string, name: string, domain: string): boolean {
  const lower = text.toLowerCase()
  return lower.includes(name.toLowerCase()) || lower.includes(domain.toLowerCase().replace(/^www\./, ''))
}

export async function getCompetitorVisibility(
  projectId: string,
  days = 30,
  platform?: string,
  options: { queryType?: 'all' | 'branded' | 'non_branded' } = {}
): Promise<CompetitorScore[]> {
  const supabase = await createDbClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const halfwayPoint = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000).toISOString()

  let promptsQuery = supabase.from('prompts').select('id').eq('project_id', projectId)
  if (options.queryType === 'branded') promptsQuery = promptsQuery.eq('is_branded', true)
  if (options.queryType === 'non_branded') promptsQuery = promptsQuery.eq('is_branded', false)

  const [{ data: brands }, { data: competitors }, { data: prompts }] = await Promise.all([
    supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
    supabase.from('competitors').select('id, name, domain').eq('project_id', projectId),
    promptsQuery,
  ])

  const promptIds = (prompts ?? []).map((p) => p.id)
  if (promptIds.length === 0) return []

  const query = supabase
    .from('runs')
    .select('id, platform, run_date, raw_response, citations(brand_id, competitor_id)')
    .in('prompt_id', promptIds)
    .eq('status', 'success')
    .gte('run_date', since)
    .not('raw_response', 'is', null)
    .neq('raw_response', '')

  const { data: runs } = await (platform ? query.eq('platform', platform as 'chatgpt' | 'gemini') : query)

  if (!runs || runs.length === 0) {
    // Return brands/competitors with zero scores so cards still render
    return [
      ...(brands ?? []).map((b) => toZeroScore(b.id, b.name, b.domain, b.is_primary)),
      ...(competitors ?? []).map((c) => toZeroScore(c.id, c.name, c.domain, false)),
    ]
  }

  // All entities to track
  const allEntities = [
    ...(brands ?? []).map((b) => ({ id: b.id, name: b.name, domain: b.domain, isOwn: b.is_primary })),
    ...(competitors ?? []).map((c) => ({ id: c.id, name: c.name, domain: c.domain, isOwn: false })),
  ]

  return allEntities.map((entity) => {
    const recentRuns = runs.filter((r) => r.run_date >= halfwayPoint)
    const olderRuns = runs.filter((r) => r.run_date < halfwayPoint)

    const mentionRate = (subset: typeof runs) => {
      if (subset.length === 0) return 0
      const mentioned = subset.filter(
        (r) => r.raw_response && mentionedInResponse(r.raw_response, entity.name, entity.domain)
      ).length
      return Math.round((mentioned / subset.length) * 100)
    }

    const currentScore = mentionRate(recentRuns)
    const previousScore = mentionRate(olderRuns)

    // Citation count — brands use brand_id, competitors use competitor_id
    const citationCount = runs.reduce((sum, r) => {
      const hits = (r.citations as Array<{ brand_id: string | null; competitor_id: string | null }>).filter(
        (c) => c.brand_id === entity.id || c.competitor_id === entity.id
      ).length
      return sum + hits
    }, 0)

    // Mention count: total runs where this entity is mentioned
    const mentionCount = runs.filter(
      (r) => r.raw_response && mentionedInResponse(r.raw_response, entity.name, entity.domain)
    ).length

    // Trend: group runs by date, compute daily mention rate
    const byDate = new Map<string, { total: number; mentioned: number }>()
    for (const r of runs) {
      const date = r.run_date.split('T')[0]
      const entry = byDate.get(date) ?? { total: 0, mentioned: 0 }
      entry.total++
      if (r.raw_response && mentionedInResponse(r.raw_response, entity.name, entity.domain)) {
        entry.mentioned++
      }
      byDate.set(date, entry)
    }

    const trendData = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, mentioned }]) => ({
        date,
        score: total > 0 ? Math.round((mentioned / total) * 100) : 0,
      }))

    return {
      brandId: entity.id,
      brandName: entity.name,
      domain: entity.domain,
      isOwn: entity.isOwn,
      currentScore,
      previousScore,
      delta: currentScore - previousScore,
      promptCoverage: mentionRate(runs),
      citationCount,
      mentionCount,
      trendData,
    }
  })
}

function toZeroScore(id: string, name: string, domain: string, isOwn: boolean): CompetitorScore {
  return {
    brandId: id, brandName: name, domain, isOwn,
    currentScore: 0, previousScore: 0, delta: 0,
    promptCoverage: 0, citationCount: 0, mentionCount: 0, trendData: [],
  }
}

export async function getShareOfVoice(
  projectId: string,
  options: { queryType?: 'all' | 'branded' | 'non_branded' } = {}
): Promise<Array<{ name: string; share: number; isOwn: boolean }>> {
  const supabase = await createDbClient()

  let promptsQuery = supabase.from('prompts').select('id').eq('project_id', projectId)
  if (options.queryType === 'branded') promptsQuery = promptsQuery.eq('is_branded', true)
  if (options.queryType === 'non_branded') promptsQuery = promptsQuery.eq('is_branded', false)

  const [{ data: brands }, { data: competitors }, { data: prompts }] = await Promise.all([
    supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
    supabase.from('competitors').select('id, name, domain').eq('project_id', projectId),
    promptsQuery,
  ])

  const promptIds = (prompts ?? []).map((p) => p.id)
  if (promptIds.length === 0) return []

  const { data: runs } = await supabase
    .from('runs')
    .select('id, raw_response')
    .in('prompt_id', promptIds)
    .eq('status', 'success')
    .not('raw_response', 'is', null)
    .neq('raw_response', '')

  if (!runs || runs.length === 0) return []

  const allEntities = [
    ...(brands ?? []).map((b) => ({ name: b.name, domain: b.domain, isOwn: b.is_primary })),
    ...(competitors ?? []).map((c) => ({ name: c.name, domain: c.domain, isOwn: false })),
  ]

  const mentionCounts: Record<string, number> = {}
  for (const entity of allEntities) {
    mentionCounts[entity.name] = 0
  }

  for (const r of runs) {
    if (!r.raw_response) continue
    for (const entity of allEntities) {
      if (mentionedInResponse(r.raw_response, entity.name, entity.domain)) {
        mentionCounts[entity.name] = (mentionCounts[entity.name] ?? 0) + 1
      }
    }
  }

  const total = Object.values(mentionCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return allEntities
    .filter((entity) => mentionCounts[entity.name] > 0)
    .map((entity) => ({
      name: entity.name,
      share: Math.round((mentionCounts[entity.name] / total) * 100),
      isOwn: entity.isOwn,
    }))
    .sort((a, b) => b.share - a.share)
}

export interface CompetitorGapStatus {
  name: string
  mentioned: boolean
  cited: boolean
}

export interface GapMatrixRow {
  promptId: string
  promptText: string
  intent: 'informational' | 'commercial' | 'transactional'
  chatgpt: {
    own: CompetitorGapStatus
    competitors: CompetitorGapStatus[]
  } | null
  gemini: {
    own: CompetitorGapStatus
    competitors: CompetitorGapStatus[]
  } | null
}

export async function getCompetitorGapMatrix(
  projectId: string,
  options: { queryType?: 'all' | 'branded' | 'non_branded' } = {}
): Promise<GapMatrixRow[]> {
  const supabase = await createDbClient()

  let promptsQuery = supabase
    .from('prompts')
    .select('id, prompt_text, intent')
    .eq('project_id', projectId)
    .eq('is_active', true)
  if (options.queryType === 'branded') promptsQuery = promptsQuery.eq('is_branded', true)
  if (options.queryType === 'non_branded') promptsQuery = promptsQuery.eq('is_branded', false)

  const [{ data: brands }, { data: competitors }, { data: prompts }] = await Promise.all([
    supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
    supabase.from('competitors').select('id, name, domain').eq('project_id', projectId),
    promptsQuery,
  ])

  const ownBrand = brands?.find((b) => b.is_primary)
  if (!ownBrand || !prompts || prompts.length === 0) return []

  const promptIds = prompts.map((p) => p.id)

  // Fetch all runs for these prompts
  const { data: runs } = await supabase
    .from('runs')
    .select(`
      id,
      prompt_id,
      platform,
      run_date,
      raw_response,
      mentions ( brand_id, mentioned ),
      citations ( brand_id, competitor_id )
    `)
    .in('prompt_id', promptIds)
    .eq('status', 'success')
    .not('raw_response', 'is', null)
    .neq('raw_response', '')
    .order('run_date', { ascending: false })

  if (!runs) return []

  // Group by prompt_id and platform to get the latest run
  const latestRuns = new Map<string, typeof runs[0]>()
  for (const r of runs) {
    const key = `${r.prompt_id}_${r.platform}`
    if (!latestRuns.has(key)) {
      latestRuns.set(key, r)
    }
  }

  const competitorList = competitors ?? []

  return prompts.map((p) => {
    const chatgptRun = latestRuns.get(`${p.id}_chatgpt`)
    const geminiRun = latestRuns.get(`${p.id}_gemini`)

    const getStatus = (run: typeof runs[0] | undefined) => {
      if (!run) return null

      // Own brand
      const ownMention = (run.mentions as Array<{ brand_id: string; mentioned: boolean }>)
        ?.find((m) => m.brand_id === ownBrand.id)
      const ownCited = (run.citations as Array<{ brand_id: string | null }>)
        ?.some((c) => c.brand_id === ownBrand.id)

      const ownStatus: CompetitorGapStatus = {
        name: ownBrand.name,
        mentioned: ownMention?.mentioned ?? false,
        cited: ownCited ?? false,
      }

      // Competitors
      const compStatuses = competitorList.map((c) => {
        const compMentioned = run.raw_response ? mentionedInResponse(run.raw_response, c.name, c.domain) : false
        const compCited = (run.citations as Array<{ competitor_id: string | null }>)
          ?.some((cit) => cit.competitor_id === c.id)

        return {
          name: c.name,
          mentioned: compMentioned,
          cited: compCited,
        }
      })

      return {
        own: ownStatus,
        competitors: compStatuses,
      }
    }

    return {
      promptId: p.id,
      promptText: p.prompt_text,
      intent: (p.intent ?? 'informational') as 'informational' | 'commercial' | 'transactional',
      chatgpt: getStatus(chatgptRun),
      gemini: getStatus(geminiRun),
    }
  })
}
