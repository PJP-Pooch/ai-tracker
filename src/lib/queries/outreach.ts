import { createDbClient } from '@/lib/supabase/db'

export interface OutreachOpportunityPrompt {
  promptText: string
  url: string
  lastSeen?: string
}

export interface OutreachOpportunity {
  domain: string
  competitorCitations: number
  competitorsCited: string
  promptsCount: number
  prompts: OutreachOpportunityPrompt[]
}

export async function getOutreachOpportunities(
  projectId: string
): Promise<OutreachOpportunity[]> {
  const supabase = await createDbClient()

  // 1. Fetch brands and competitors for the project
  const [{ data: brands }, { data: competitors }] = await Promise.all([
    supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId),
    supabase.from('competitors').select('id, name, domain').eq('project_id', projectId).order('name', { ascending: true }),
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
      run_date,
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

  const validRuns = runs.filter((r) => r.raw_response && r.raw_response.trim() !== '')

  const outreachOpportunities: Record<string, {
    domain: string
    competitorCitations: number
    competitorsCited: Set<string>
    promptsCount: Set<string>
    prompts: OutreachOpportunityPrompt[]
  }> = {}

  for (const run of validRuns) {
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

        // Skip Google search grounding redirect domains and search engine domains
        const isGoogleOrSearchEngine = 
          cDomain === 'vertexaisearch.cloud.google.com' ||
          cDomain === 'google.com' ||
          cDomain.includes('.google.') ||
          cDomain.startsWith('google.') ||
          cDomain === 'bing.com' ||
          cDomain === 'duckduckgo.com'

        if (isOwnDomain || isCompetitorDomain || isGoogleOrSearchEngine) continue

        if (!outreachOpportunities[cDomain]) {
          outreachOpportunities[cDomain] = {
            domain: cDomain,
            competitorCitations: 0,
            competitorsCited: new Set(),
            promptsCount: new Set(),
            prompts: [],
          }
        }

        outreachOpportunities[cDomain].competitorCitations += 1
        mentionedCompetitors.forEach((comp) => outreachOpportunities[cDomain].competitorsCited.add(comp.name))
        outreachOpportunities[cDomain].promptsCount.add(promptId)

        // Deduplicate prompts. For vertexaisearch redirect URLs, compare only by prompt text.
        // If a real URL is found later, upgrade the redirect URL to the real URL.
        const isNewVertex = citation.url.includes('vertexaisearch.cloud.google.com')
        
        // Helper to get clean URL by removing query params and hash fragment
        const getCleanUrl = (urlStr: string): string => {
          if (urlStr.includes('vertexaisearch.cloud.google.com')) {
            return urlStr
          }
          try {
            const parsed = new URL(urlStr)
            return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')
          } catch (e) {
            return urlStr.split(/[?#]/)[0].replace(/\/$/, '')
          }
        }

        const cleanNew = getCleanUrl(citation.url)
        const runDate = run.run_date || ''

        // Find existing prompts matching the text
        const existingPrompts = outreachOpportunities[cDomain].prompts.filter(
          (p) => p.promptText === promptText
        )

        if (isNewVertex) {
          // If it's a vertex URL, we only add it if there are no prompts at all for this text
          if (existingPrompts.length === 0) {
            outreachOpportunities[cDomain].prompts.push({
              promptText,
              url: citation.url,
              lastSeen: runDate,
            })
          } else {
            // Update lastSeen of existing matches if this run is newer
            existingPrompts.forEach((ep) => {
              if (runDate && (!ep.lastSeen || new Date(runDate) > new Date(ep.lastSeen))) {
                ep.lastSeen = runDate
              }
            })
          }
        } else {
          // It's a real URL
          let matchedAndUpdated = false

          for (const ep of existingPrompts) {
            const isEpVertex = ep.url.includes('vertexaisearch.cloud.google.com')
            
            if (isEpVertex) {
              // Upgrade vertex redirect to real URL
              ep.url = cleanNew
              ep.lastSeen = runDate
              matchedAndUpdated = true
              break
            } else {
              const cleanEp = getCleanUrl(ep.url)
              if (cleanEp === cleanNew) {
                // Already exists, update lastSeen if newer
                if (runDate && (!ep.lastSeen || new Date(runDate) > new Date(ep.lastSeen))) {
                  ep.lastSeen = runDate
                }
                // Ensure it uses the clean URL format
                ep.url = cleanNew
                matchedAndUpdated = true
                break
              }
            }
          }

          if (!matchedAndUpdated) {
            outreachOpportunities[cDomain].prompts.push({
              promptText,
              url: cleanNew,
              lastSeen: runDate,
            })
          }
        }
      }
    }
  }

  return Object.values(outreachOpportunities)
    .map((o) => ({
      domain: o.domain,
      competitorCitations: o.competitorCitations,
      competitorsCited: Array.from(o.competitorsCited).join(', ') || 'Competitors mentioned in response',
      promptsCount: o.promptsCount.size,
      prompts: o.prompts,
    }))
    .sort((a, b) => b.competitorCitations - a.competitorCitations)
}
