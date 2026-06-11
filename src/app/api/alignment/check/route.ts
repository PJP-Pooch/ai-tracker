import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractBrandClaims, verifyClaimAgainstContent } from '@/lib/openai/brand-alignment'
import { searchDomain } from '@/lib/firecrawl/client'
import type { AlignmentClaim, AlignmentVerdict } from '@/lib/openai/brand-alignment'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json() as { runId: string }
  const { runId } = body
  if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 })

  const supabase = createAdminClient()

  // Load run + prompt + project + primary brand in one query
  const { data: run } = await supabase
    .from('runs')
    .select(`
      id,
      raw_response,
      status,
      prompts!inner (
        project_id,
        projects!inner (
          brand_positioning,
          alignment_check_mode,
          brands ( id, name, domain, is_primary )
        )
      )
    `)
    .eq('id', runId)
    .single()

  if (!run || run.status !== 'success' || !run.raw_response) {
    return NextResponse.json({ error: 'Run not found or not successful' }, { status: 404 })
  }

  const prompt = (run as unknown as {
    prompts: {
      project_id: string
      projects: {
        brand_positioning: string | null
        alignment_check_mode: string
        brands: Array<{ id: string; name: string; domain: string; is_primary: boolean }>
      }
    }
  }).prompts

  const project = prompt.projects
  const primaryBrand = project.brands.find((b) => b.is_primary)

  if (!primaryBrand) {
    return NextResponse.json({ error: 'No primary brand configured' }, { status: 400 })
  }

  if (!project.brand_positioning) {
    return NextResponse.json({ error: 'No brand positioning brief set. Configure it in Settings > Brand Intelligence.' }, { status: 400 })
  }

  // Upsert as 'checking'
  await supabase.from('run_brand_alignment').upsert(
    { run_id: runId, status: 'checking', brand_brief_snapshot: project.brand_positioning },
    { onConflict: 'run_id' }
  )

  try {
    // Step 1: Extract claims from the AI response
    const claims = await extractBrandClaims(run.raw_response, primaryBrand.name)

    if (claims.length === 0) {
      await supabase.from('run_brand_alignment').upsert(
        {
          run_id: runId,
          status: 'done',
          overall_verdict: 'unchecked',
          claims: [],
          brand_brief_snapshot: project.brand_positioning,
          checked_at: new Date().toISOString(),
        },
        { onConflict: 'run_id' }
      )
      return NextResponse.json({ verdict: 'unchecked', claims: [] })
    }

    // Step 2: For each claim, search the brand's domain and verify
    const results: AlignmentClaim[] = await Promise.all(
      claims.map(async (claim) => {
        const pages = await searchDomain(primaryBrand.domain, claim, 2)
        const bestPage = pages[0]

        if (!bestPage) {
          return {
            ai_claim: claim,
            verdict: 'not_found' as AlignmentVerdict,
            explanation: 'No relevant page found on the brand website.',
            source_url: null,
            source_quote: null,
          }
        }

        const verification = await verifyClaimAgainstContent(
          claim,
          primaryBrand.name,
          bestPage.url,
          bestPage.markdown
        )

        return {
          ai_claim: claim,
          verdict: verification.verdict,
          explanation: verification.explanation,
          source_url: bestPage.url,
          source_quote: verification.source_quote,
        }
      })
    )

    // Step 3: Compute overall verdict
    const hasContradiction = results.some((r) => r.verdict === 'contradicted')
    const hasConfirmed = results.some((r) => r.verdict === 'confirmed')
    const allNotFound = results.every((r) => r.verdict === 'not_found')

    const overall = (
      allNotFound
        ? 'unchecked'
        : hasContradiction && hasConfirmed
          ? 'mixed'
          : hasContradiction
            ? 'contradicted'
            : 'aligned'
    ) as 'aligned' | 'contradicted' | 'mixed' | 'unchecked'

    await supabase.from('run_brand_alignment').upsert(
      {
        run_id: runId,
        status: 'done',
        overall_verdict: overall,
        claims: results as unknown as import('@/lib/supabase/types').Json,
        brand_brief_snapshot: project.brand_positioning,
        checked_at: new Date().toISOString(),
      },
      { onConflict: 'run_id' }
    )

    return NextResponse.json({ verdict: overall, claims: results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase.from('run_brand_alignment').upsert(
      { run_id: runId, status: 'failed', error_message: message },
      { onConflict: 'run_id' }
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
