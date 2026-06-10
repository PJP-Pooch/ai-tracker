import { createDbClient } from '@/lib/supabase/db'

export interface OutreachOpportunity {
  domain: string
  competitorCitations: number
  competitorsCited: string
  promptsCount: number
  sampleUrl: string
  samplePrompt: string
}

export async function getOutreachOpportunities(
  projectId: string
): Promise<OutreachOpportunity[]> {
  const supabase = await createDbClient()

  // 1. Fetch brands and competitors for the project
  const [{ data: brands }, { data: competitors }] = await Promise.all([
    supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
    supabase.from('competitors').select('id, name, domain').eq('project_id', projectId),
  ])

  if (!brands || brands.length === 0) {
    return []
  }

  const primaryBrand = brands.find((b) => b.is_primary) || brands[0]
  const projectCompetitors = competitors || []

  // 2. Fetch successful runs with nested prompts and citations
  const { data: runs, error } = await supabase
    .from('runs')
    .select(`
      id,
      raw_response,
      prompt_id,
      prompts!inner (
        id,
        prompt_text,
        project_id
      ),
      citations (
        id,
        domain,
        url,
        brand_id,
        competitor_id
      )
    `)
    .eq('prompts.project_id', projectId)
    .eq('status', 'success')

  if (error || !runs) {
    console.error('Error fetching runs for outreach opportunities:', error)
    return []
  }

  const outreachOpportunities: Record<string, {
    domain: string
    competitorCitations: number
    competitorsCited: Set<string>
    promptsCount: Set<string>
    sampleUrl: string
    samplePrompt: string
  }> = {}

  for (const run of runs) {
    const text = run.raw_response || ''
    // Handle nested prompts safely (TypeScript types might see it as object or array)
    const promptText = run.prompts && !Array.isArray(run.prompts)
      ? (run.prompts as any).prompt_text
      : Array.isArray(run.prompts) && run.prompts[0]
        ? (run.prompts[0] as any).prompt_text
        : ''
    const promptId = run.prompts && !Array.isArray(run.prompts)
      ? (run.prompts as any).id
      : Array.isArray(run.prompts) && run.prompts[0]
        ? (run.prompts[0] as any).id
        : run.prompt_id

    const runCitations = run.citations || []

    // A competitor is relevant if mentioned in text or cited
    const hasCompetitorCitation = runCitations.some((c) =>
      projectCompetitors.some((comp) => c.domain === comp.domain || c.domain.includes(comp.domain))
    )
    const mentionedCompetitors = projectCompetitors.filter((comp) =>
      text.toLowerCase().includes(comp.name.toLowerCase()) ||
      text.toLowerCase().includes(comp.domain.toLowerCase())
    )
    const isCompetitorRelevant = mentionedCompetitors.length > 0 || hasCompetitorCitation

    // Check if our brand is cited directly in this run
    const isBrandCited = runCitations.some((c) =>
      c.brand_id === primaryBrand.id ||
      c.domain === primaryBrand.domain ||
      c.domain.includes(primaryBrand.domain)
    )

    // Candidate run: competitor is cited/mentioned, but our brand is NOT cited
    if (isCompetitorRelevant && !isBrandCited) {
      for (const citation of runCitations) {
        const cDomain = citation.domain

        // Skip if it's our own brand domain or a competitor's own domain
        const isOwnDomain = cDomain === primaryBrand.domain || cDomain.includes(primaryBrand.domain)
        const isCompetitorDomain = projectCompetitors.some((comp) =>
          cDomain === comp.domain || cDomain.includes(comp.domain)
        )

        if (isOwnDomain || isCompetitorDomain) continue

        if (!outreachOpportunities[cDomain]) {
          outreachOpportunities[cDomain] = {
            domain: cDomain,
            competitorCitations: 0,
            competitorsCited: new Set(),
            promptsCount: new Set(),
            sampleUrl: citation.url,
            samplePrompt: promptText,
          }
        }

        outreachOpportunities[cDomain].competitorCitations += 1
        mentionedCompetitors.forEach((comp) => outreachOpportunities[cDomain].competitorsCited.add(comp.name))
        outreachOpportunities[cDomain].promptsCount.add(promptId)
      }
    }
  }

  return Object.values(outreachOpportunities)
    .map((o) => ({
      domain: o.domain,
      competitorCitations: o.competitorCitations,
      competitorsCited: Array.from(o.competitorsCited).join(', ') || 'Competitors mentioned in response',
      promptsCount: o.promptsCount.size,
      sampleUrl: o.sampleUrl,
      samplePrompt: o.samplePrompt,
    }))
    .sort((a, b) => b.competitorCitations - a.competitorCitations)
}
