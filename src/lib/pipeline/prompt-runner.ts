import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMResponse, type LLMPlatform } from '@/lib/dataforseo/llm-responses'
import { dataForSEORateLimiter } from '@/lib/dataforseo/rate-limiter'
import { parseMentions, parseCitations } from '@/lib/dataforseo/response-parser'
import { analyzeSentimentBatch } from '@/lib/openai/sentiment'
import { PLATFORM_MODELS } from './cost-tracker'

interface BrandRow {
  id: string
  name: string
  domain: string
}

interface CompetitorRow {
  id: string
  domain: string
}

interface PromptWithRelations {
  id: string
  prompt_text: string
  project_id: string
  brands: BrandRow[]
  competitors: CompetitorRow[]
}

const PLATFORMS: LLMPlatform[] = ['chat_gpt', 'gemini']

export async function runPromptPipeline(prompt: PromptWithRelations): Promise<void> {
  const supabase = createAdminClient()

  for (const platform of PLATFORMS) {
    const modelName = PLATFORM_MODELS[platform]
    let runId: string | null = null

    // Create run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        prompt_id: prompt.id,
        platform: platform === 'chat_gpt' ? 'chatgpt' : 'gemini',
        model_name: modelName,
        status: 'running',
      })
      .select('id')
      .single()

    if (runError || !run) {
      console.error(`Failed to create run for prompt ${prompt.id}:`, runError)
      continue
    }

    runId = run.id

    try {
      // Respect rate limit
      await dataForSEORateLimiter.acquire()

      // Call DataForSEO
      const llmResult = await getLLMResponse({
        platform,
        userPrompt: prompt.prompt_text,
        modelName,
        webSearch: true,
      })

      // Parse citations
      const citationRows = parseCitations(llmResult.annotations)

      // Match citations to owned brands and competitors by domain
      const enrichedCitations = citationRows.map((c) => ({
        run_id: runId!,
        domain: c.domain,
        url: c.url,
        title: c.title,
        snippet: c.snippet,
        position: c.position,
        brand_id:
          prompt.brands.find((b) => b.domain === c.domain || c.domain.includes(b.domain))?.id ??
          null,
        competitor_id:
          prompt.competitors.find(
            (comp) => comp.domain === c.domain || c.domain.includes(comp.domain)
          )?.id ?? null,
      }))

      // Parse mentions for each tracked brand
      const mentionInputs = prompt.brands.map((brand) => {
        const parsed = parseMentions({
          responseText: llmResult.content,
          brandName: brand.name,
          brandDomain: brand.domain,
        })
        return { brand, parsed }
      })

      // Batch sentiment analysis for all mentioned brands
      const mentionedBrands = mentionInputs.filter((m) => m.parsed.mentioned)
      const sentimentResults = await analyzeSentimentBatch(
        mentionedBrands.map((m) => ({
          brandName: m.brand.name,
          snippet: m.parsed.snippet ?? m.brand.name,
        }))
      )

      // Build mention insert rows
      const mentionRows = mentionInputs.map((m, idx) => {
        const sentimentIdx = mentionedBrands.findIndex((mb) => mb.brand.id === m.brand.id)
        const sentiment =
          m.parsed.mentioned && sentimentIdx >= 0
            ? sentimentResults[sentimentIdx]?.sentiment ?? 'neutral'
            : null

        return {
          run_id: runId!,
          brand_id: m.brand.id,
          mentioned: m.parsed.mentioned,
          position: m.parsed.position,
          sentiment,
          snippet: m.parsed.snippet,
        }
      })

      // Batch insert mentions and citations, then update run status
      await Promise.all([
        supabase.from('mentions').insert(mentionRows),
        enrichedCitations.length > 0
          ? supabase.from('citations').insert(enrichedCitations)
          : Promise.resolve(),
        supabase
          .from('runs')
          .update({
            status: 'success',
            raw_response: llmResult.content,
            cost_usd: llmResult.costUsd,
          })
          .eq('id', runId),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Run failed for prompt ${prompt.id} / ${platform}:`, message)

      if (runId) {
        await supabase
          .from('runs')
          .update({ status: 'failed', error_message: message })
          .eq('id', runId)
      }
    }
  }
}
