import { dataForSEORequest, DataForSEOError } from './client'

export interface AIKeywordVolumeParams {
  keywords: string[]
  locationCode: number
  languageCode: string
}

export interface AIKeywordVolumeItem {
  keyword: string
  ai_search_volume: number | null
}

export interface AIKeywordItem {
  keyword: string
  search_volume: number | null
  ai_search_volume: number | null
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH' | null
  cpc: number | null
}

interface RawAIKeywordVolumeItem {
  keyword: string
  ai_search_volume: number | null
  ai_monthly_searches: Array<{ year: number; month: number; ai_search_volume: number }> | null
}

interface AIKeywordVolumeResult {
  keyword: string
  location_code: number
  language_code: string
  items: RawAIKeywordVolumeItem[] | null
  items_count: number
}

export async function getAIKeywordVolume(
  params: AIKeywordVolumeParams
): Promise<AIKeywordVolumeItem[]> {
  const endpoint = '/ai_optimization/ai_keyword_data/keywords_search_volume/live'

  const response = await dataForSEORequest<AIKeywordVolumeResult>(endpoint, [
    {
      keywords: params.keywords,
      location_code: params.locationCode,
      language_code: params.languageCode,
    },
  ])

  const task = response.tasks[0]
  if (task.status_code !== 20000 || !task.result?.length) {
    throw new DataForSEOError(
      task.status_code,
      task.status_message || 'No result returned'
    )
  }

  const result = task.result[0]
  if (!result.items?.length) return []

  return result.items.map((item) => ({
    keyword: item.keyword,
    ai_search_volume: item.ai_search_volume ?? null,
  }))
}
