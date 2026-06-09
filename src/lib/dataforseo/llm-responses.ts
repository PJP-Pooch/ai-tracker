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
  items: Array<{
    type: 'message' | 'reasoning'
    message: {
      role: string
      content: string
    }
  }>
  annotations: Array<{
    type: 'url_citation'
    url_citation: {
      url: string
      title: string
      snippet: string
      start_index: number
      end_index: number
    }
  }>
  money_spent: number
  datetime: string
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

  const response = await dataForSEORequest<LLMResponseResult>(endpoint, [
    {
      user_prompt: params.userPrompt,
      model_name: params.modelName,
      web_search: params.webSearch ?? true,
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

  // Extract message content from items array
  const messageItem = result.items.find((i) => i.type === 'message')
  const content = messageItem?.message?.content ?? ''

  return {
    content,
    annotations: result.annotations.map((a) => ({
      url: a.url_citation.url,
      title: a.url_citation.title,
      snippet: a.url_citation.snippet,
    })),
    costUsd: result.money_spent ?? task.cost ?? 0,
    modelName: result.model_name,
  }
}
