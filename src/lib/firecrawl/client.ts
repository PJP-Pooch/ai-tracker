const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1'

function getApiKey() {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) throw new Error('FIRECRAWL_API_KEY is not set')
  return key
}

export interface FirecrawlPage {
  url: string
  title: string | null
  markdown: string
}

export async function scrapeUrl(url: string): Promise<FirecrawlPage | null> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  })

  if (!res.ok) return null
  const json = await res.json() as { success: boolean; data?: { markdown?: string; metadata?: { title?: string } } }
  if (!json.success || !json.data?.markdown) return null

  return {
    url,
    title: json.data.metadata?.title ?? null,
    markdown: json.data.markdown,
  }
}

export async function searchDomain(domain: string, query: string, limit = 3): Promise<FirecrawlPage[]> {
  const siteQuery = `site:${domain} ${query}`

  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      query: siteQuery,
      limit,
      scrapeOptions: { formats: ['markdown'] },
    }),
  })

  if (!res.ok) return []
  const json = await res.json() as {
    success: boolean
    data?: Array<{ url: string; title?: string; markdown?: string; description?: string }>
  }
  if (!json.success || !json.data) return []

  return json.data
    .filter((r) => r.markdown || r.description)
    .map((r) => ({
      url: r.url,
      title: r.title ?? null,
      markdown: r.markdown ?? r.description ?? '',
    }))
}
