import { createDbClient } from '@/lib/supabase/db'
import type { AlignmentClaim } from '@/lib/openai/brand-alignment'

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
