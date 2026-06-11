import { createDbClient } from '@/lib/supabase/db'
import type { AlignmentClaim } from '@/lib/openai/brand-alignment'

export interface BrandAlignmentResult {
  id: string
  run_id: string
  status: 'pending' | 'checking' | 'done' | 'failed'
  overall_verdict: 'aligned' | 'contradicted' | 'mixed' | 'unchecked' | null
  brand_brief_snapshot: string | null
  claims: AlignmentClaim[]
  error_message: string | null
  checked_at: string | null
}

export async function getBrandAlignment(runId: string): Promise<BrandAlignmentResult | null> {
  const supabase = await createDbClient()
  const { data } = await supabase
    .from('run_brand_alignment')
    .select('*')
    .eq('run_id', runId)
    .maybeSingle()

  if (!data) return null
  return data as unknown as BrandAlignmentResult
}
