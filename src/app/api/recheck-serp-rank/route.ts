import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSERPRanking } from '@/lib/dataforseo/organic-serp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { query: string; runId: string; projectId: string }
  const { query, runId, projectId } = body

  if (!query || !runId || !projectId) {
    return NextResponse.json({ error: 'query, runId, and projectId are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch project settings via prompts join (same pattern as run-prompt route)
  const { data: promptRow, error: promptError } = await admin
    .from('prompts')
    .select(`
      id,
      projects!inner (
        target_location_code,
        target_language_code,
        brands ( id, name, domain )
      )
    `)
    .eq('project_id', projectId)
    .limit(1)
    .single()

  if (promptError || !promptRow) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const project = (
    promptRow as unknown as {
      projects: {
        target_location_code: number | null
        target_language_code: string | null
        brands: { id: string; name: string; domain: string }[]
      }
    }
  ).projects

  const brands = project?.brands ?? []

  try {
    // Call DataForSEO for a fresh ranking check
    const serpResult = await checkSERPRanking({
      keyword: query,
      depth: 10,
      locationCode: project?.target_location_code ?? undefined,
      languageCode: project?.target_language_code ?? undefined,
    })

    // Find if any brand domain matches a result
    let matchedItem: { rank_group?: number; rank_absolute?: number; url?: string; domain?: string } | null = null
    if (serpResult.items) {
      for (const item of serpResult.items) {
        if (!item.domain) continue
        const matched = brands.find((b) => {
          const brandDomain = b.domain.toLowerCase().replace('www.', '').trim()
          const itemDomain = item.domain!.toLowerCase().replace('www.', '').trim()
          return (
            itemDomain === brandDomain ||
            itemDomain.endsWith('.' + brandDomain) ||
            itemDomain.includes(brandDomain)
          )
        })
        if (matched) {
          matchedItem = item
          break
        }
      }
    }

    // Insert a fresh query_fanout row
    const { error: insertError } = await admin.from('query_fanouts').insert({
      run_id: runId,
      query,
      rank_group: matchedItem ? (matchedItem.rank_group ?? null) : null,
      rank_absolute: matchedItem ? (matchedItem.rank_absolute ?? null) : null,
      ranked_url: matchedItem ? (matchedItem.url ?? null) : null,
    })

    if (insertError) {
      console.error('Failed to insert query_fanout recheck row:', insertError)
      return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      rank_group: matchedItem?.rank_group ?? null,
      rank_absolute: matchedItem?.rank_absolute ?? null,
      ranked_url: matchedItem?.url ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Recheck SERP rank error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
