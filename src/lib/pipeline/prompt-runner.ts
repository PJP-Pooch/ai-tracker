import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMResponse, type LLMPlatform } from '@/lib/dataforseo/llm-responses'
import { getLLMScraper } from '@/lib/dataforseo/llm-scraper'
import { dataForSEORateLimiter } from '@/lib/dataforseo/rate-limiter'
import { checkSERPRanking } from '@/lib/dataforseo/organic-serp'
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
  platforms?: string[]
  target_location_code?: number | null
  target_language_code?: string | null
}

export interface PipelineResult {
  succeeded: number
  failed: number
  errors: string[]
}

export async function runPromptPipeline(prompt: PromptWithRelations): Promise<PipelineResult> {
  const supabase = createAdminClient()
  const result: PipelineResult = { succeeded: 0, failed: 0, errors: [] }

  const rawPlatforms = prompt.platforms ?? ['chatgpt', 'gemini']

  for (const platform of rawPlatforms) {
    let runId: string | null = null
    const modelName = platform === 'chatgpt_scraper' 
      ? 'gpt-4o' 
      : (platform === 'gemini_scraper'
          ? 'gemini-1.5-pro'
          : (platform === 'chatgpt' ? PLATFORM_MODELS['chat_gpt'] : PLATFORM_MODELS['gemini']))

    // Create run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        prompt_id: prompt.id,
        platform: platform as 'chatgpt' | 'gemini' | 'chatgpt_scraper' | 'gemini_scraper',
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

      // Helper function to retry on rate limit or service unavailable errors
      const executeWithRetry = async <T>(apiCall: () => Promise<T>): Promise<T> => {
        let retries = 3
        let delay = 3000 // 3 seconds initial delay
        while (true) {
          try {
            return await apiCall()
          } catch (error) {
            const isRateLimit = error instanceof Error && (
              error.message.includes('rate_limit_exceeded') ||
              error.message.includes('Service Unavailable') ||
              error.message.includes('429')
            )
            if (isRateLimit && retries > 0) {
              console.warn(`Upstream rate limit/service unavailable on ${platform}, retrying in ${delay}ms... (${retries} attempts remaining). Error: ${error.message}`)
              await new Promise((resolve) => setTimeout(resolve, delay))
              retries--
              delay *= 2 // Exponential backoff
            } else {
              throw error
            }
          }
        }
      }

      let responseText = ''
      let costUsd = 0
      let annotations: any[] = []
      let scraperPayload: any = null

      let fanOutRows: any[] = []

      if (platform === 'chatgpt_scraper' || platform === 'gemini_scraper') {
        // Call LLM Scraper
        const se = platform === 'chatgpt_scraper' ? 'chat_gpt' : 'gemini'
        const scraperResult = await executeWithRetry(() => getLLMScraper({
          keyword: prompt.prompt_text,
          se,
          locationCode: prompt.target_location_code ?? undefined,
          languageCode: prompt.target_language_code ?? undefined,
        }))
        responseText = scraperResult.markdown || ''
        costUsd = scraperResult.costUsd
        annotations = (scraperResult.sources ?? []).map((s) => ({
          url: s.url,
          title: s.title || s.source_name || '',
          snippet: s.snippet || '',
        }))
        scraperPayload = {
          ads: scraperResult.ads,
          products: scraperResult.products,
          local_businesses: scraperResult.localBusinesses,
        }

        // Check organic rankings for fan_out_queries
        const rawFanOutQueries = scraperResult.fanOutQueries ?? []
        const fanOutQueries = Array.from(new Set(
          rawFanOutQueries.flatMap((q) => splitConcatenatedQuery(q, prompt.prompt_text))
        ))
        if (fanOutQueries.length > 0) {
          const checkPromises = fanOutQueries.map(async (query) => {
            try {
              await dataForSEORateLimiter.acquire()
              const serpResult = await executeWithRetry(() => checkSERPRanking({
                keyword: query,
                depth: 10,
                locationCode: scraperResult.locationCode,
                languageCode: scraperResult.languageCode,
              }))
              
              let matchedItem: any = null
              if (serpResult.items) {
                for (const item of serpResult.items) {
                  if (!item.domain) continue
                  const matchedBrand = prompt.brands.find((b) => {
                    const brandDomain = b.domain.toLowerCase().replace('www.', '').trim()
                    const itemDomain = item.domain!.toLowerCase().replace('www.', '').trim()
                    return itemDomain === brandDomain || itemDomain.endsWith('.' + brandDomain) || itemDomain.includes(brandDomain)
                  })
                  if (matchedBrand) {
                    matchedItem = item
                    break
                  }
                }
              }
              
              return {
                run_id: runId!,
                query,
                rank_group: matchedItem ? (matchedItem.rank_group ?? null) : null,
                rank_absolute: matchedItem ? (matchedItem.rank_absolute ?? null) : null,
                ranked_url: matchedItem ? (matchedItem.url ?? null) : null,
              }
            } catch (err) {
              console.error(`Failed to check SERP rank for fan-out query "${query}":`, err)
              return {
                run_id: runId!,
                query,
                rank_group: null,
                rank_absolute: null,
                ranked_url: null,
              }
            }
          })
          fanOutRows = await Promise.all(checkPromises)
        }
      } else {
        const platformToUse = platform === 'chatgpt' ? 'chat_gpt' : platform
        const llmResult = await executeWithRetry(() => getLLMResponse({
          platform: platformToUse as LLMPlatform,
          userPrompt: prompt.prompt_text,
          modelName,
          webSearch: true,
          locationCode: prompt.target_location_code ?? undefined,
          languageCode: prompt.target_language_code ?? undefined,
        }))
        responseText = llmResult.content || ''
        costUsd = llmResult.costUsd
        annotations = llmResult.annotations || []
      }

      // Parse citations
      const citationRows = parseCitations(annotations)

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
          responseText: responseText,
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
      const mentionRows = mentionInputs.map((m) => {
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
          mention_type: m.parsed.mentionType,
        }
      })

      // Batch insert mentions, citations, and query fanouts, then update run status
      await Promise.all([
        mentionRows.length > 0 ? supabase.from('mentions').insert(mentionRows) : Promise.resolve(),
        enrichedCitations.length > 0
          ? supabase.from('citations').insert(enrichedCitations)
          : Promise.resolve(),
        fanOutRows.length > 0
          ? supabase.from('query_fanouts').insert(fanOutRows)
          : Promise.resolve(),
        supabase
          .from('runs')
          .update({
            status: 'success',
            raw_response: responseText,
            cost_usd: costUsd,
            scraper_payload: scraperPayload,
          })
          .eq('id', runId),
      ])

      result.succeeded++
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Run failed for prompt ${prompt.id} / ${platform}:`, message)
      result.failed++
      result.errors.push(`${platform}: ${message}`)

      if (runId) {
        await supabase
          .from('runs')
          .update({ status: 'failed', error_message: message })
          .eq('id', runId)
      }
    }
  }

  return result
}

function splitConcatenatedQuery(query: string, mainPromptText: string): string[] {
  if (!query) return [];
  
  query = query.trim().replace(/\s+/g, ' ');
  const words = query.split(' ');
  const splitIndices = new Set<number>();
  
  const triggers = [
    'vet',
    'veterinary',
    'top',
    'dry',
    'wet'
  ];

  for (let i = 1; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const prevWord = words[i - 1];
    
    // Rule 1: Split after a 4-digit year/number (e.g. 2024-2029)
    if (/^20\d{2}$/.test(prevWord)) {
      splitIndices.add(i);
      continue;
    }
    
    // Rule 2: Split before a core trigger word
    if (triggers.includes(word)) {
      if (i + 1 < words.length) {
        splitIndices.add(i);
      }
    }
  }

  // Generate sub-queries based on split indices
  const sortedIndices = Array.from(splitIndices).sort((a, b) => a - b);
  const rawSubQueries: string[] = [];
  let lastIndex = 0;
  
  for (const index of sortedIndices) {
    if (index > lastIndex) {
      rawSubQueries.push(words.slice(lastIndex, index).join(' '));
      lastIndex = index;
    }
  }
  if (lastIndex < words.length) {
    rawSubQueries.push(words.slice(lastIndex).join(' '));
  }

  // Post-processing: clean up and merge too-short segments (like "UK")
  const subQueries: string[] = [];
  for (let i = 0; i < rawSubQueries.length; i++) {
    const q = rawSubQueries[i].trim().replace(/^[,.\-\s]+|[,.\-\s]+$/g, '');
    if (!q) continue;

    // A query is too short if it has only 1 word, or is just "UK"
    const qw = q.split(' ');
    const isTooShort = qw.length <= 1 || (qw.length === 2 && qw[0].toLowerCase() === 'uk' && qw[1].length <= 3);

    if (isTooShort && subQueries.length > 0) {
      // Merge with previous query
      subQueries[subQueries.length - 1] = `${subQueries[subQueries.length - 1]} ${q}`;
    } else if (isTooShort && i + 1 < rawSubQueries.length) {
      // Merge with next query by prepending it
      rawSubQueries[i + 1] = `${q} ${rawSubQueries[i + 1]}`;
    } else {
      subQueries.push(q);
    }
  }

  // Final cleanup of duplicates and trailing "UK"s
  return subQueries
    .map(q => {
      const qw = q.split(' ');
      
      // If query ends with "UK" and contains another "UK" earlier, remove the trailing "UK"
      if (qw.length > 1 && qw[qw.length - 1].toLowerCase() === 'uk') {
        const hasUkEarlier = qw.slice(0, qw.length - 1).some(w => w.toLowerCase() === 'uk');
        if (hasUkEarlier) {
          qw.pop();
        }
      }
      
      // Also clean up duplicate trailing "UK"s
      if (qw.length > 2 && qw[qw.length - 1].toLowerCase() === 'uk' && qw[qw.length - 2].toLowerCase() === 'uk') {
        qw.pop();
      }
      
      return qw.join(' ');
    })
    .filter(q => q.length > 0);
}
