import { createDbClient } from '@/lib/supabase/db'

export interface ScrapedProductItem {
  id: string              // unique identifier (run_id + product_id/index)
  runId: string
  runDate: string
  promptId: string
  promptText: string
  category: string
  brand: string
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

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractBrand(
  title: string,
  domain: string,
  trackedBrands: { name: string; domain: string }[],
  trackedCompetitors: { name: string; domain: string }[],
  allTrackedNames: string[]
): string {
  const cleanTitle = title.trim()
  const lowerTitle = cleanTitle.toLowerCase()
  const lowerDomain = domain.toLowerCase()

  // 1. Check if the domain matches any tracked brand/competitor domain
  for (const b of trackedBrands) {
    const d = b.domain.toLowerCase().replace('www.', '').trim()
    if (d && (lowerDomain === d || lowerDomain.endsWith('.' + d) || d.includes(lowerDomain))) {
      return b.name
    }
  }
  for (const c of trackedCompetitors) {
    const d = c.domain.toLowerCase().replace('www.', '').trim()
    if (d && (lowerDomain === d || lowerDomain.endsWith('.' + d) || d.includes(lowerDomain))) {
      return c.name
    }
  }

  // 2. Check if any tracked brand/competitor name is at the start of the title
  for (const name of allTrackedNames) {
    if (lowerTitle.startsWith(name.toLowerCase())) {
      return name
    }
  }

  // 3. Check if any tracked brand/competitor is anywhere in the title (whole word match)
  for (const name of allTrackedNames) {
    const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i')
    if (regex.test(lowerTitle)) {
      return name
    }
  }

  // 4. Check some common well-known brands as a helper
  const commonBrands = [
    'Royal Canin', 'Purina Pro Plan', 'Purina', 'Burns', 'Acana', 'Orijen', 
    'Lily\'s Kitchen', 'Butternut Box', 'Scrumbles', 'Harringtons', 
    'James Wellbeloved', 'Hill\'s Science Plan', 'Hill\'s', 'Eukanuba', 
    'Iams', 'Arden Grange', 'Applaws', 'Canagan', 'Barking Heads',
    'Pooch & Mutt', 'Pooch and Mutt', 'Crave', 'Forthglade', 'Nala',
    'Pedigree', 'Cesar', 'Chappie', 'Bakers', 'Winalot', 'Skinners'
  ]
  for (const cb of commonBrands) {
    if (lowerTitle.startsWith(cb.toLowerCase())) {
      return cb
    }
  }
  for (const cb of commonBrands) {
    const regex = new RegExp(`\\b${escapeRegExp(cb)}\\b`, 'i')
    if (regex.test(lowerTitle)) {
      return cb
    }
  }

  // 5. Fallback to the first word(s) of the title
  const words = cleanTitle.split(/\s+/)
  if (words.length > 0) {
    let candidate = words[0]
    // Clean punctuation like commas, dashes, colons, but keep single quotes for brands like Lily's
    candidate = candidate.replace(/[^a-zA-Z0-9']/g, '')
    if (candidate.length <= 2 && words.length > 1) {
      const second = words[1].replace(/[^a-zA-Z0-9']/g, '')
      return `${candidate} ${second}`
    }
    return candidate || 'Unknown Brand'
  }

  return 'Unknown Brand'
}

export async function getProjectScrapedProducts(projectId: string): Promise<ScrapedProductItem[]> {
  const supabase = await createDbClient()

  // Fetch project brands
  const { data: brands } = await supabase
    .from('brands')
    .select('name, domain')
    .eq('project_id', projectId)

  // Fetch project competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('name, domain')
    .eq('project_id', projectId)

  const trackedBrands = brands || []
  const trackedCompetitors = competitors || []
  const allTrackedNames = [
    ...trackedBrands.map(b => b.name),
    ...trackedCompetitors.map(c => c.name)
  ]

  // Fetch successful scraper runs under prompts belonging to the project
  const { data: runs, error } = await supabase
    .from('runs')
    .select(`
      id,
      run_date,
      platform,
      scraper_payload,
      prompts!inner(id, prompt_text, project_id, category)
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

      const domain = prod.domain || prod.merchants || 'Unknown Merchant'
      const title = prod.title || 'Unknown Product'
      const detectedBrand = extractBrand(title, domain, trackedBrands, trackedCompetitors, allTrackedNames)

      products.push({
        id: `${run.id}-${prod.product_id || `idx-${index}`}`,
        runId: run.id,
        runDate: run.run_date,
        promptId: run.prompts.id,
        promptText: run.prompts.prompt_text,
        category: run.prompts.category || 'Uncategorized',
        brand: detectedBrand,
        platform: run.platform as 'chatgpt_scraper' | 'gemini_scraper',
        title: title,
        price: prod.price != null ? (typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)) : 0,
        currency: prod.currency || 'USD',
        url: prod.url || '',
        domain: domain,
        images: prod.images || [],
        rating: normalizedRating,
        tag: prod.tag || '',
      })
    })
  }

  return products
}
