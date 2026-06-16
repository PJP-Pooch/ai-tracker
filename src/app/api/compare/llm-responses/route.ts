import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLLMResponse } from '@/lib/dataforseo/llm-responses'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      promptText: string
      platform?: 'chat_gpt' | 'gemini'
      modelName?: string
      webSearch?: boolean
    }

    const { promptText, platform, modelName, webSearch } = body

    if (!promptText) {
      return NextResponse.json({ error: 'promptText is required' }, { status: 400 })
    }

    const start = Date.now()
    const response = await getLLMResponse({
      platform: platform ?? 'chat_gpt',
      userPrompt: promptText,
      modelName: modelName ?? (platform === 'gemini' ? 'gemini-3.1-pro-preview' : 'gpt-4.1'),
      webSearch: webSearch ?? true,
    })
    const durationMs = Date.now() - start

    return NextResponse.json({
      ...response,
      timeSec: durationMs / 1000,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('LLM Responses API Compare Route failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
