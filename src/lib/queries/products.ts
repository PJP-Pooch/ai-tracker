import { createDbClient } from '@/lib/supabase/db'

export interface ScrapedProductItem {
  id: string              // unique identifier (run_id + product_id/index)
  runId: string
  runDate: string
  promptId: string
  promptText: string
  platform: 'chatgpt_scraper' | 'gemini_scraper'
  title: string
  price: number
  currency: string
  url: string
  domain: string
  images: string[]
  rating: {
    value: number
    votes_count?: number
  } | null
  tag: string
}

export async function getProjectScrapedProducts(projectId: string): Promise<ScrapedProductItem[]> {
  const supabase = await createDbClient()

  // Fetch successful scraper runs under prompts belonging to the project
  const { data: runs, error } = await supabase
    .from('runs')
    .select(`
      id,
      run_date,
      platform,
      scraper_payload,
      prompts!inner(id, prompt_text, project_id)
    `)
    .eq('status', 'success')
    .eq('prompts.project_id', projectId)
    .in('platform', ['chatgpt_scraper', 'gemini_scraper'])
    .order('run_date', { ascending: false })

  if (error || !runs) {
    if (error) console.error('Error fetching scraped products:', error)
    return []
  }

  const products: ScrapedProductItem[] = []

  for (const run of runs) {
    const payload = run.scraper_payload as any
    const runProducts = payload?.products ?? []

    runProducts.forEach((prod: any, index: number) => {
      // Normalize rating field since it can be a number, string, or object
      let normalizedRating: { value: number; votes_count?: number } | null = null
      if (prod.rating != null) {
        if (typeof prod.rating === 'object') {
          normalizedRating = {
            value: typeof prod.rating.value === 'number' ? prod.rating.value : parseFloat(prod.rating.value || '0'),
            votes_count: prod.rating.votes_count ? parseInt(prod.rating.votes_count, 10) : undefined,
          }
        } else {
          const val = typeof prod.rating === 'number' ? prod.rating : parseFloat(prod.rating)
          if (!isNaN(val)) {
            normalizedRating = { value: val }
          }
        }
      }

      products.push({
        id: `${run.id}-${prod.product_id || `idx-${index}`}`,
        runId: run.id,
        runDate: run.run_date,
        promptId: run.prompts.id,
        promptText: run.prompts.prompt_text,
        platform: run.platform as 'chatgpt_scraper' | 'gemini_scraper',
        title: prod.title || 'Unknown Product',
        price: prod.price != null ? (typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)) : 0,
        currency: prod.currency || 'USD',
        url: prod.url || '',
        domain: prod.domain || prod.merchants || 'Unknown Merchant',
        images: prod.images || [],
        rating: normalizedRating,
        tag: prod.tag || '',
      })
    })
  }

  return products
}
