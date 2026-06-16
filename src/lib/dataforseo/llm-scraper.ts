import { dataForSEORequest, DataForSEOError } from './client'

export interface LLMScraperRequestParams {
  keyword: string
  locationName?: string
  languageName?: string
  locationCode?: number
  languageCode?: string
  device?: 'desktop' | 'mobile'
  os?: 'windows' | 'macos' | 'android' | 'ios'
  se?: 'chat_gpt' | 'gemini'
}

export interface LLMScraperSearchElement {
  type: string
  url: string
  domain: string
  title: string
  description: string
  breadcrumb: string
}

export interface LLMScraperSource {
  type: string
  title: string
  snippet: string | null
  domain: string
  url: string
  thumbnail: string | null
  source_name: string | null
  publication_date: string | null
  markdown: string | null
}

export interface LLMScraperBrandEntity {
  type: string
  title: string
  category: string
  markdown: string
  urls: string[] | null
}

export interface LLMScraperItemProduct {
  type: string
  product_id: string
  merchants: string
  id_to_token_map: string
  title: string
  rating: number | null
  price: number
  currency: string
  tag: string
  url: string
  domain: string
  images: string[]
}

export interface LLMScraperItemLocalBusiness {
  type: string
  title: string
  description: string
  address: string
  phone: string
  reviews_count: number
  url: string | null
  domain: string | null
  rating: {
    rating_type: string
    value: number
    votes_count: number
    rating_max: number
  } | null
}

export interface LLMScraperItemAd {
  type: string
  rank_group: number
  rank_absolute: number
  title: string
  snippet: string
  url: string
  domain: string
  image_url: string | null
  advertiser: {
    name: string
    url: string
    favicon_url: string | null
  }
}

export interface LLMScraperResultItem {
  type: 'chat_gpt_images' | 'chat_gpt_text' | 'chat_gpt_table' | 'chat_gpt_products' | 'chat_gpt_local_businesses' | 'chat_gpt_ad' | string
  rank_group?: number
  rank_absolute?: number
  markdown?: string
  text?: string | null
  table?: {
    table_header: string[]
    table_content: string[][]
  }
  items?: Array<any>
  // Ad elements are represented directly in the item or within items array
  title?: string
  snippet?: string
  url?: string
  domain?: string
  image_url?: string | null
  advertiser?: {
    name: string
    url: string
    favicon_url: string | null
  }
}

export interface LLMScraperResponseResult {
  keyword: string
  location_code: number
  language_code: string
  model: string
  check_url: string
  datetime: string
  markdown: string | null
  search_results: LLMScraperSearchElement[] | null
  sources: LLMScraperSource[] | null
  fan_out_queries: string[] | null
  brand_entities: LLMScraperBrandEntity[] | null
  se_results_count: number
  items_count: number
  items: LLMScraperResultItem[] | null
}

export interface ParsedLLMScraperResponse {
  keyword: string
  model: string
  costUsd: number
  timeSec: number
  markdown: string
  searchResults: LLMScraperSearchElement[]
  sources: LLMScraperSource[]
  brandEntities: LLMScraperBrandEntity[]
  ads: LLMScraperItemAd[]
  products: LLMScraperItemProduct[]
  localBusinesses: LLMScraperItemLocalBusiness[]
  fanOutQueries: string[]
  locationCode?: number
  languageCode?: string
  rawResponse: any
}

export async function getLLMScraper(
  params: LLMScraperRequestParams
): Promise<ParsedLLMScraperResponse> {
  const se = params.se ?? 'chat_gpt'
  const endpoint = `/ai_optimization/${se}/llm_scraper/live/advanced`

  const requestBody: Record<string, unknown> = {
    keyword: params.keyword,
  }

  if (params.locationCode) {
    requestBody.location_code = params.locationCode
  } else {
    requestBody.location_name = params.locationName ?? 'United States'
  }

  if (params.languageCode) {
    requestBody.language_code = params.languageCode
  } else {
    requestBody.language_name = params.languageName ?? 'English'
  }

  const response = await dataForSEORequest<LLMScraperResponseResult>(endpoint, [requestBody])

  const task = response.tasks[0]
  if (task.status_code !== 20000 || !task.result?.length) {
    throw new DataForSEOError(
      task.status_code,
      task.status_message || 'No result returned'
    )
  }

  const result = task.result[0]

  // Extract Ads, Products, and Local Businesses from the items array
  const ads: LLMScraperItemAd[] = []
  const products: LLMScraperItemProduct[] = []
  const localBusinesses: LLMScraperItemLocalBusiness[] = []

  if (result.items) {
    for (const item of result.items) {
      if (item.type === 'chat_gpt_ad' || item.type === 'gemini_ad') {
        ads.push(item as unknown as LLMScraperItemAd)
      } else if ((item.type === 'chat_gpt_products' || item.type === 'gemini_products') && item.items) {
        products.push(...(item.items as LLMScraperItemProduct[]))
      } else if ((item.type === 'chat_gpt_local_businesses' || item.type === 'gemini_local_businesses') && item.items) {
        localBusinesses.push(...(item.items as LLMScraperItemLocalBusiness[]))
      }
    }
  }

  return {
    keyword: result.keyword,
    model: result.model ?? 'gpt-4o',
    costUsd: task.cost ?? 0.004, // Default to $0.004 if not present
    timeSec: parseFloat((task as any).time ?? '0'),
    markdown: result.markdown ?? '',
    searchResults: result.search_results ?? [],
    sources: result.sources ?? [],
    brandEntities: result.brand_entities ?? [],
    ads,
    products,
    localBusinesses,
    fanOutQueries: result.fan_out_queries ?? [],
    locationCode: result.location_code,
    languageCode: result.language_code,
    rawResponse: response,
  }
}
