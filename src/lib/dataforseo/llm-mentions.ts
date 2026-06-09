import { dataForSEORequest } from './client'

export interface LLMMentionResult {
  question: string
  answer: string
  sources: Array<{
    url: string
    title: string
    domain: string
  }>
  ai_search_volume: number | null
  platform: string
  first_response_at: string
  last_response_at: string
}

export async function getLLMMentions(params: {
  target: string
  locationCode?: number
  languageCode?: string
  platform?: 'google' | 'chat_gpt'
  limit?: number
}): Promise<LLMMentionResult[]> {
  const response = await dataForSEORequest<LLMMentionResult>(
    '/ai_optimization/llm_mentions/search/live',
    [
      {
        target: params.target,
        location_code: params.locationCode ?? 2826, // UK
        language_code: params.languageCode ?? 'en',
        platform: params.platform ?? 'chat_gpt',
        limit: params.limit ?? 100,
      },
    ]
  )

  return response.tasks[0].result ?? []
}
