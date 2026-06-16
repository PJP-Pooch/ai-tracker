import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLLMScraper } from '@/lib/dataforseo/llm-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      keyword: string
      locationName?: string
      languageName?: string
      device?: 'desktop' | 'mobile'
      se?: 'chat_gpt' | 'gemini'
    }

    const { keyword, locationName, languageName, device, se } = body

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    const start = Date.now()
    const response = await getLLMScraper({
      keyword,
      locationName: locationName ?? 'United States',
      languageName: languageName ?? 'English',
      device: device ?? 'desktop',
      se: se ?? 'chat_gpt',
    })
    const durationMs = Date.now() - start

    // Overwrite the execution time measured on our end to show a real-world duration
    return NextResponse.json({
      ...response,
      timeSec: durationMs / 1000,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('LLM Scraper API Compare Route failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
