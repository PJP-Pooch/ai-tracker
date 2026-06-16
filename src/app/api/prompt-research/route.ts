import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIKeywordVolume } from '@/lib/dataforseo/ai-keyword-data'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      keywords: string[]
      locationCode: number
      languageCode: string
    }

    const { keywords, locationCode, languageCode } = body

    if (!keywords?.length) {
      return NextResponse.json({ error: 'keywords are required' }, { status: 400 })
    }
    if (!locationCode || !languageCode) {
      return NextResponse.json({ error: 'locationCode and languageCode are required' }, { status: 400 })
    }

    const cleaned = [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))].slice(0, 1000)

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'No valid keywords provided' }, { status: 400 })
    }

    const results = await getAIKeywordVolume({ keywords: cleaned, locationCode, languageCode })

    results.sort((a, b) => (b.ai_search_volume ?? 0) - (a.ai_search_volume ?? 0))

    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Prompt research route failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
