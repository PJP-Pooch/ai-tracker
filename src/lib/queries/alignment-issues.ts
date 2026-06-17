import { createDbClient } from '@/lib/supabase/db'
import type { AlignmentClaim, AlignmentVerdict } from '@/lib/openai/brand-alignment'

export interface AlignmentIssue {
  alignment_id: string
  run_id: string
  platform: 'chatgpt' | 'gemini'
  run_date: string
  overall_verdict: 'contradicted' | 'mixed'
  prompt_id: string
  prompt_text: string
  claims: AlignmentClaim[]
  contradicted_claims: AlignmentClaim[]
  checked_at: string | null
}

export async function getAlignmentIssues(projectId: string): Promise<AlignmentIssue[]> {
  const supabase = await createDbClient()

  const { data } = await supabase
    .from('run_brand_alignment')
    .select(`
      id,
      run_id,
      overall_verdict,
      claims,
      checked_at,
      runs!inner (
        platform,
        run_date,
        prompts!inner (
          id,
          prompt_text,
          project_id
        )
      )
    `)
    .in('overall_verdict', ['contradicted', 'mixed'])
    .eq('runs.prompts.project_id', projectId)
    .eq('status', 'done')
    .order('checked_at', { ascending: false })

  if (!data) return []

  return data.map((row) => {
    const run = (row as unknown as {
      runs: {
        platform: 'chatgpt' | 'gemini'
        run_date: string
        prompts: { id: string; prompt_text: string }
      }
    }).runs

    const claims = (row.claims ?? []) as unknown as AlignmentClaim[]
    const contradicted = claims.filter((c) => c.verdict === 'contradicted')

    return {
      alignment_id: row.id,
      run_id: row.run_id,
      platform: run.platform,
      run_date: run.run_date,
      overall_verdict: row.overall_verdict as 'contradicted' | 'mixed',
      prompt_id: run.prompts.id,
      prompt_text: run.prompts.prompt_text,
      claims,
      contradicted_claims: contradicted,
      checked_at: row.checked_at,
    }
  })
}

export interface AlignmentTopicClaim {
  ai_claim: string
  verdict: AlignmentVerdict
  explanation: string
  source_url: string | null
  source_quote: string | null
  prompt_text: string
  prompt_id: string
  run_id: string
  platform: 'chatgpt' | 'gemini'
  run_date: string
  occurrences: number
}

export interface AlignmentTopics {
  positive: AlignmentTopicClaim[]
  negative: AlignmentTopicClaim[]
  missing: AlignmentTopicClaim[]
}

export async function getAlignmentTopics(projectId: string): Promise<AlignmentTopics> {
  const supabase = await createDbClient()

  const { data } = await supabase
    .from('run_brand_alignment')
    .select(`
      run_id,
      claims,
      checked_at,
      runs!inner (
        platform,
        run_date,
        prompts!inner (
          id,
          prompt_text,
          project_id
        )
      )
    `)
    .eq('runs.prompts.project_id', projectId)
    .eq('status', 'done')
    .order('checked_at', { ascending: false })

  if (!data) return { positive: [], negative: [], missing: [] }

  // Use a map keyed by claim text to deduplicate, keeping the most recent
  const byVerdict: Record<AlignmentVerdict, Map<string, AlignmentTopicClaim>> = {
    confirmed: new Map(),
    contradicted: new Map(),
    not_found: new Map(),
  }

  for (const row of data) {
    const typedRow = row as unknown as { run_id: string; runs: { platform: 'chatgpt' | 'gemini'; run_date: string; prompts: { id: string; prompt_text: string } } }
    const run = typedRow.runs

    const claims = (row.claims ?? []) as unknown as AlignmentClaim[]

    for (const claim of claims) {
      const key = claim.ai_claim.toLowerCase().trim()
      const map = byVerdict[claim.verdict]
      if (!map) continue

      const existing = map.get(key)
      if (existing) {
        existing.occurrences++
      } else {
        map.set(key, {
          ai_claim: claim.ai_claim,
          verdict: claim.verdict,
          explanation: claim.explanation,
          source_url: claim.source_url,
          source_quote: claim.source_quote,
          prompt_text: run.prompts.prompt_text,
          prompt_id: run.prompts.id,
          run_id: typedRow.run_id,
          platform: run.platform,
          run_date: run.run_date,
          occurrences: 1,
        })
      }
    }
  }

  const sortByOccurrences = (a: AlignmentTopicClaim, b: AlignmentTopicClaim) => b.occurrences - a.occurrences

  return {
    positive: Array.from(byVerdict.confirmed.values()).sort(sortByOccurrences),
    negative: Array.from(byVerdict.contradicted.values()).sort(sortByOccurrences),
    missing: Array.from(byVerdict.not_found.values()).sort(sortByOccurrences),
  }
}

export interface AlignmentSummary {
  total_issues: number
  contradicted_count: number
  mixed_count: number
  affected_prompts: number
  chatgpt_issues: number
  gemini_issues: number
}

export function summariseAlignmentIssues(issues: AlignmentIssue[]): AlignmentSummary {
  const promptIds = new Set(issues.map((i) => i.prompt_id))
  return {
    total_issues: issues.length,
    contradicted_count: issues.filter((i) => i.overall_verdict === 'contradicted').length,
    mixed_count: issues.filter((i) => i.overall_verdict === 'mixed').length,
    affected_prompts: promptIds.size,
    chatgpt_issues: issues.filter((i) => i.platform === 'chatgpt').length,
    gemini_issues: issues.filter((i) => i.platform === 'gemini').length,
  }
}
