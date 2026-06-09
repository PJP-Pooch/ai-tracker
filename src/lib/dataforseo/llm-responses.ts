import { dataForSEORequest, DataForSEOError } from './client'

export type LLMPlatform = 'chat_gpt' | 'gemini'

const PLATFORM_ENDPOINTS: Record<LLMPlatform, string> = {
  chat_gpt: '/ai_optimization/chat_gpt/llm_responses/live',
  gemini: '/ai_optimization/gemini/llm_responses/live',
}

export interface LLMResponseResult {
  model_name: string
  input_tokens: number
  output_tokens: number
  money_spent: number
  datetime: string
  items: Array<{
    type: 'message' | 'reasoning'
    sections: Array<{
      type: string
      text?: string
      annotations?: Array<{
        type?: string
        url?: string
        title?: string
        snippet?: string
        url_citation?: {
          url: string
          title: string
          snippet: string
          start_index: number
          end_index: number
        }
      }> | null
    }>
  }>
}

export interface ParsedLLMResponse {
  content: string
  annotations: Array<{
    url: string
    title: string
    snippet: string
  }>
  costUsd: number
  modelName: string
}

export async function getLLMResponse(params: {
  platform: LLMPlatform
  userPrompt: string
  modelName: string
  webSearch?: boolean
}): Promise<ParsedLLMResponse> {
  const endpoint = PLATFORM_ENDPOINTS[params.platform]

  const requestBody: Record<string, unknown> = {
    user_prompt: params.userPrompt,
    model_name: params.modelName,
    web_search: params.webSearch ?? true,
  }

  const response = await dataForSEORequest<LLMResponseResult>(endpoint, [requestBody])

  const task = response.tasks[0]
  if (task.status_code !== 20000 || !task.result?.length) {
    throw new DataForSEOError(
      task.status_code,
      task.status_message || 'No result returned'
    )
  }

  const result = task.result[0]

  // Content lives in items[*].sections[*].text (type=message, section type=text)
  const sections = (result.items ?? [])
    .filter((i) => i.type === 'message')
    .flatMap((i) => i.sections ?? [])

  const content = sections
    .filter((s) => s.type === 'text')
    .map((s) => s.text ?? '')
    .join('\n')

  // Annotations (citations) live inside sections alongside the text
  const annotations = sections
    .flatMap((s) => s.annotations ?? [])
    .filter((a) => a.url || a.url_citation?.url)
    .map((a) => ({
      url: a.url || a.url_citation!.url,
      title: a.title || a.url_citation?.title || '',
      snippet: a.snippet || a.url_citation?.snippet || '',
    }))

  return {
    content,
    annotations,
    costUsd: result.money_spent ?? task.cost ?? 0,
    modelName: result.model_name,
  }
}
