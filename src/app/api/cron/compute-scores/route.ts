import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const PLATFORMS = ['chatgpt', 'gemini']

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: brands, error } = await supabase
    .from('brands')
    .select(`
      id,
      project_id,
      projects!inner (
        platforms
      )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let computed = 0
  let failures = 0

  for (const brand of brands ?? []) {
    const project = (brand as unknown as { projects: { platforms: string[] } }).projects
    const platforms = project?.platforms ?? ['chatgpt', 'gemini']

    // Fetch unique active categories for this project (excluding critique prompts)
    const { data: prompts } = await supabase
      .from('prompts')
      .select('category')
      .eq('project_id', brand.project_id)
      .eq('is_active', true)
      .eq('is_critique', false)
    
    const categories = Array.from(new Set((prompts ?? []).map(p => p.category).filter(Boolean))) as (string | null)[]
    const categoriesToCompute = [null, ...categories] // null represents overall project score

    for (const platform of platforms) {
      for (const category of categoriesToCompute) {
        try {
          const { data: score, error: rpcError } = await supabase.rpc(
            'compute_visibility_score',
            {
              p_project_id: brand.project_id,
              p_brand_id: brand.id,
              p_date: today,
              p_platform: platform,
              p_category: category,
            }
          )

          if (rpcError) throw rpcError

          await supabase.from('visibility_scores').upsert(
            {
              project_id: brand.project_id,
              brand_id: brand.id,
              date: today,
              platform,
              category,
              total_score: score,
            },
            { onConflict: 'project_id,brand_id,date,platform,category' }
          )

          computed++
        } catch (err) {
          console.error(`Score computation failed for brand ${brand.id} / ${platform} / category ${category ?? 'overall'}:`, err)
          failures++
        }
      }
    }
  }

  return NextResponse.json({ computed, failures, date: today })
}
