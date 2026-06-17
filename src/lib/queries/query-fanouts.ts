import { createDbClient } from '@/lib/supabase/db'

export interface QueryFanoutVariation {
  query: string
  runId: string
  avgRank: number | null
  top10Rate: number
  lastRank: number | null
  lastUrl: string | null
  lastChecked: string
}

export interface QueryFanoutGroup {
  promptId: string
  promptText: string
  projectId: string
  category: string | null
  fanoutCount: number
  avgRank: number | null
  top10Count: number
  totalRunsChecked: number
  variations: QueryFanoutVariation[]
}

export async function getProjectQueryFanouts(
  projectId: string
): Promise<QueryFanoutGroup[]> {
  const supabase = await createDbClient()

  // Fetch prompts, runs (only successful scraper runs), and their query_fanouts
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      prompt_text,
      category,
      runs (
        id,
        platform,
        run_date,
        status,
        query_fanouts (
          id,
          run_id,
          query,
          rank_group,
          rank_absolute,
          ranked_url,
          created_at
        )
      )
    `)
    .eq('project_id', projectId)

  if (error || !data) {
    console.error('Failed to fetch project query fanouts:', error)
    return []
  }

  const result: QueryFanoutGroup[] = []

  for (const prompt of data) {
    // Filter runs that are successful scraper runs and have fanouts
    const scraperRuns = (prompt.runs ?? []).filter(
      (r) =>
        (r.platform === 'chatgpt_scraper' || r.platform === 'gemini_scraper') &&
        r.status === 'success' &&
        r.query_fanouts &&
        r.query_fanouts.length > 0
    )

    if (scraperRuns.length === 0) continue

    // Group fanouts by query string across all runs of this prompt
    const fanoutsByQuery: Record<
      string,
      Array<{
        run_id: string
        rank_group: number | null
        rank_absolute: number | null
        ranked_url: string | null
        created_at: string
      }>
    > = {}

    for (const run of scraperRuns) {
      for (const fanout of run.query_fanouts) {
        if (!fanoutsByQuery[fanout.query]) {
          fanoutsByQuery[fanout.query] = []
        }
        fanoutsByQuery[fanout.query].push(fanout)
      }
    }

    const queryStrings = Object.keys(fanoutsByQuery)
    if (queryStrings.length === 0) continue

    const variations = queryStrings.map((query) => {
      const history = fanoutsByQuery[query]
      // Sort history descending by created_at to get the latest ranking check
      const sortedHistory = [...history].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const latest = sortedHistory[0]

      // Compute average rank for this variation (only where it ranked, i.e., rank_group is not null)
      const rankedRuns = history.filter((h) => h.rank_group !== null)
      const avgRank =
        rankedRuns.length > 0
          ? rankedRuns.reduce((sum, h) => sum + h.rank_group!, 0) / rankedRuns.length
          : null

      // Compute top 10 rate (percentage of runs where we ranked in top 10)
      const top10Rate = history.length > 0 ? (rankedRuns.length / history.length) * 100 : 0

      return {
        query,
        runId: latest.run_id,
        avgRank,
        top10Rate,
        lastRank: latest.rank_group,
        lastUrl: latest.ranked_url,
        lastChecked: latest.created_at,
      }
    })

    // Compute prompt-level averages
    const allRankedVariations = variations.filter((v) => v.avgRank !== null)
    const promptAvgRank =
      allRankedVariations.length > 0
        ? allRankedVariations.reduce((sum, v) => sum + v.avgRank!, 0) /
          allRankedVariations.length
        : null

    const totalVariationsCount = variations.length
    const rankedVariationsCount = variations.filter((v) => v.lastRank !== null).length

    result.push({
      promptId: prompt.id,
      promptText: prompt.prompt_text,
      projectId,
      category: prompt.category,
      fanoutCount: totalVariationsCount,
      avgRank: promptAvgRank,
      top10Count: rankedVariationsCount,
      totalRunsChecked: scraperRuns.length,
      variations: variations.sort((a, b) => a.query.localeCompare(b.query)),
    })
  }

  return result.sort((a, b) => a.promptText.localeCompare(b.promptText))
}
