import { createDbClient } from '@/lib/supabase/db'

export interface PromptTableRow {
  id: string
  promptText: string
  priority: 'low' | 'medium' | 'high'
  volume: number
  isActive: boolean
  isBranded: boolean
  intent: 'informational' | 'commercial' | 'transactional'
  category: string | null
  isCritique: boolean
  chatgpt_position: number | null
  chatgpt_mentioned: boolean
  chatgpt_sentiment: 'positive' | 'neutral' | 'negative' | null
  chatgpt_mention_type: 'top_choice' | 'recommended' | 'mentioned_only' | null
  gemini_position: number | null
  gemini_mentioned: boolean
  gemini_sentiment: 'positive' | 'neutral' | 'negative' | null
  gemini_mention_type: 'top_choice' | 'recommended' | 'mentioned_only' | null
  citationCount: number
  citationShare: number | null   // % of citations in runs that belong to the tracked brand
  avgPosition: number | null     // average mention position across both platforms
  webSearchPct: number | null    // % of runs where web search was used (has citations)
  lastRunDate: string | null
}

function isRunInDateRange(runDateStr: string, dateRange?: string): boolean {
  if (!dateRange || dateRange === 'all') return true

  const runTime = new Date(runDateStr).getTime()
  const now = new Date()

  switch (dateRange) {
    case 'today': {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      return runTime >= startOfToday
    }
    case 'yesterday': {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime()
      return runTime >= startOfYesterday && runTime <= endOfYesterday
    }
    case '7days': {
      const limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
      return runTime >= limit
    }
    case '30days': {
      const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()
      return runTime >= limit
    }
    default:
      return true
  }
}

export async function getPromptsWithStats(
  projectId: string,
  filters: {
    platform?: string
    priority?: string
    search?: string
    intent?: string
    queryType?: 'all' | 'branded' | 'non_branded'
    dateRange?: 'today' | 'yesterday' | '7days' | '30days' | 'all'
    isCritique?: boolean
  } = {}
): Promise<PromptTableRow[]> {
  const supabase = await createDbClient()

  let query = supabase
    .from('prompts')
    .select(`
      id,
      prompt_text,
      priority,
      volume,
      is_active,
      is_branded,
      intent,
      category,
      is_critique,
      runs (
        id,
        platform,
        run_date,
        status,
        raw_response,
        mentions ( brand_id, position, sentiment, mentioned, mention_type ),
        citations ( id, brand_id )
      )
    `)
    .eq('project_id', projectId)

  if (filters.isCritique !== undefined) {
    query = query.eq('is_critique', filters.isCritique)
  } else {
    query = query.eq('is_critique', false)
  }

  const { data: prompts } = await query.order('created_at', { ascending: false })

  if (!prompts) return []

  return prompts
    .filter((p) => {
      if (filters.priority && p.priority !== filters.priority) return false
      if (filters.intent && p.intent !== filters.intent) return false
      if (filters.search && !p.prompt_text.toLowerCase().includes(filters.search.toLowerCase()))
        return false
      if (filters.queryType === 'branded' && !p.is_branded) return false
      if (filters.queryType === 'non_branded' && p.is_branded) return false
      return true
    })
    .map((prompt) => {
      const successRuns = (prompt.runs ?? []).filter(
        (r) => r.status === 'success' && r.raw_response && r.raw_response.trim() !== '' && isRunInDateRange(r.run_date, filters.dateRange)
      )

      // Get latest run per platform
      const latestChatGPT = successRuns
        .filter((r) => r.platform === 'chatgpt')
        .sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime())[0]

      const latestGemini = successRuns
        .filter((r) => r.platform === 'gemini')
        .sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime())[0]

      // Primary brand mention (first mention in the run, position-wise)
      const getPrimaryMention = (run: typeof latestChatGPT) => {
        if (!run) return null
        return (run.mentions ?? [])
          .filter((m) => m.mentioned)
          .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0] ?? null
      }

      const chatgptMention = getPrimaryMention(latestChatGPT)
      const geminiMention = getPrimaryMention(latestGemini)

      const allCitations = successRuns.flatMap((r) => (r.citations ?? []))
      const allCitationIds = new Set(allCitations.map((c) => c.id))
      const brandCitationCount = allCitations.filter((c) => c.brand_id !== null).length
      const totalCitationCount = allCitations.length
      const citationShare = totalCitationCount > 0
        ? (brandCitationCount / totalCitationCount) * 100
        : null

      // Average mention position across both platforms
      const positionValues: number[] = []
      if (chatgptMention?.position != null) positionValues.push(chatgptMention.position)
      if (geminiMention?.position != null) positionValues.push(geminiMention.position)
      const avgPosition = positionValues.length > 0
        ? positionValues.reduce((a, b) => a + b, 0) / positionValues.length
        : null

      // Web search % — % of successful runs that had at least one citation
      const runsWithCitations = successRuns.filter((r) => (r.citations ?? []).length > 0).length
      const webSearchPct = successRuns.length > 0
        ? (runsWithCitations / successRuns.length) * 100
        : null

      const allDates = successRuns.map((r) => r.run_date).sort().reverse()

      return {
        id: prompt.id,
        promptText: prompt.prompt_text,
        priority: prompt.priority,
        volume: prompt.volume,
        isActive: prompt.is_active,
        isBranded: prompt.is_branded ?? false,
        intent: (prompt.intent ?? 'informational') as 'informational' | 'commercial' | 'transactional',
        category: prompt.category,
        isCritique: (prompt as unknown as { is_critique?: boolean }).is_critique ?? false,
        chatgpt_position: chatgptMention?.position ?? null,
        chatgpt_mentioned: !!chatgptMention,
        chatgpt_sentiment: chatgptMention?.sentiment ?? null,
        chatgpt_mention_type: chatgptMention?.mention_type as 'top_choice' | 'recommended' | 'mentioned_only' | null,
        gemini_position: geminiMention?.position ?? null,
        gemini_mentioned: !!geminiMention,
        gemini_sentiment: geminiMention?.sentiment ?? null,
        gemini_mention_type: geminiMention?.mention_type as 'top_choice' | 'recommended' | 'mentioned_only' | null,
        citationCount: allCitationIds.size,
        citationShare,
        avgPosition,
        webSearchPct,
        lastRunDate: allDates[0] ?? null,
      }
    })
    // platform filter is display-only — all prompts track both platforms
}

export interface RunHistory {
  id: string
  platform: 'chatgpt' | 'gemini' | 'chatgpt_scraper' | 'gemini_scraper'
  run_date: string
  raw_response: string | null
  status: string
  scraper_payload?: {
    ads?: any[]
    products?: any[]
    local_businesses?: any[]
  } | null
  mentions: Array<{
    brand_id: string | null
    position: number | null
    sentiment: string | null
    mentioned: boolean
    snippet: string | null
    brands: { name: string } | null
    mention_type: 'top_choice' | 'recommended' | 'mentioned_only' | null
  }>
  citations: Array<{
    domain: string
    url: string
    title: string | null
    position: number | null
  }>
}

export async function getPromptRunHistory(
  promptId: string,
  days = 30
): Promise<RunHistory[]> {
  const supabase = await createDbClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('runs')
    .select(`
      id,
      platform,
      run_date,
      raw_response,
      status,
      scraper_payload,
      mentions ( brand_id, position, sentiment, mentioned, snippet, mention_type, brands!brand_id ( name ) ),
      citations ( domain, url, title, position )
    `)
    .eq('prompt_id', promptId)
    .gte('run_date', since)
    .eq('status', 'success')
    .order('run_date', { ascending: false })

  const runs = (data ?? []) as RunHistory[]
  return runs.filter((r) => r.raw_response && r.raw_response.trim() !== '')
}

