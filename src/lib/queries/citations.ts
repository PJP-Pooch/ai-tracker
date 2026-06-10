import { createDbClient } from '@/lib/supabase/db'

export interface CitedDomain {
  domain: string
  citation_count: number
  run_count: number
  brand_name: string | null
  competitor_name: string | null
  ownerTag: 'own' | 'competitor' | 'third-party'
  ownerLabel: string
}

export interface CitedUrl {
  url: string
  domain: string
  title: string | null
  citation_count: number
  brand_name: string | null
  competitor_name: string | null
}

export interface CitationOverlapEntry {
  name: string
  type: 'brand' | 'competitor'
  chatgpt_count: number
  gemini_count: number
}

export async function getTopCitedDomains(
  projectId: string,
  filters: { platform?: string; dateFrom?: string; dateTo?: string; limit?: number } = {}
): Promise<CitedDomain[]> {
  const supabase = await createDbClient()

  const { data, error } = await supabase.rpc('get_top_cited_domains', {
    p_project_id: projectId,
    ...(filters.platform ? { p_platform: filters.platform } : {}),
    ...(filters.dateFrom ? { p_date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { p_date_to: filters.dateTo } : {}),
    p_limit: filters.limit ?? 50,
  })

  if (error || !data) return []

  return (data as CitedDomain[]).map((row) => ({
    ...row,
    ownerTag: row.brand_name ? 'own' : row.competitor_name ? 'competitor' : 'third-party',
    ownerLabel: row.brand_name
      ? 'Your Brand'
      : row.competitor_name
        ? `Competitor: ${row.competitor_name}`
        : 'Third Party',
  }))
}

export async function getTopCitedUrls(
  projectId: string,
  filters: { domain?: string; platform?: string; limit?: number } = {}
): Promise<CitedUrl[]> {
  const supabase = await createDbClient()

  const { data, error } = await supabase.rpc('get_top_cited_urls', {
    p_project_id: projectId,
    ...(filters.domain ? { p_domain: filters.domain } : {}),
    ...(filters.platform ? { p_platform: filters.platform } : {}),
    p_limit: filters.limit ?? 50,
  })

  if (error || !data) return []

  return data as CitedUrl[]
}

export async function getCitationOverlap(projectId: string): Promise<CitationOverlapEntry[]> {
  const supabase = await createDbClient()

  const { data: runs } = await supabase
    .from('runs')
    .select(`
      platform,
      citations ( domain, brands!brand_id ( name ), competitors!competitor_id ( name ) )
    `)
    .in(
      'prompt_id',
      (
        await supabase
          .from('prompts')
          .select('id')
          .eq('project_id', projectId)
      ).data?.map((p) => p.id) ?? []
    )
    .eq('status', 'success')

  if (!runs) return []

  const counts: Record<string, { name: string; type: 'brand' | 'competitor'; chatgpt: number; gemini: number }> = {}

  for (const run of runs) {
    for (const citation of run.citations ?? []) {
      const brand = Array.isArray(citation.brands) ? citation.brands[0] : citation.brands
      const competitor = Array.isArray(citation.competitors) ? citation.competitors[0] : citation.competitors

      if (brand && typeof brand === 'object' && 'name' in brand) {
        const key = `brand_${brand.name}`
        if (!counts[key]) counts[key] = { name: brand.name as string, type: 'brand', chatgpt: 0, gemini: 0 }
        if (run.platform === 'chatgpt') counts[key].chatgpt++
        else counts[key].gemini++
      } else if (competitor && typeof competitor === 'object' && 'name' in competitor) {
        const key = `comp_${competitor.name}`
        if (!counts[key]) counts[key] = { name: competitor.name as string, type: 'competitor', chatgpt: 0, gemini: 0 }
        if (run.platform === 'chatgpt') counts[key].chatgpt++
        else counts[key].gemini++
      }
    }
  }

  return Object.values(counts)
    .map((c) => ({
      name: c.name,
      type: c.type,
      chatgpt_count: c.chatgpt,
      gemini_count: c.gemini,
    }))
    .sort((a, b) => (b.chatgpt_count + b.gemini_count) - (a.chatgpt_count + a.gemini_count))
}
