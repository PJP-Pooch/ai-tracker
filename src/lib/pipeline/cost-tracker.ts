import type { LLMPlatform } from '@/lib/dataforseo/llm-responses'

const MODEL_COSTS: Record<string, number> = {
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.001,
  'o1': 0.015,
  'gemini-1.5-pro': 0.004,
  'gemini-2.0-flash': 0.002,
  'gemini-1.5-flash': 0.001,
}

export function estimateCost(platform: LLMPlatform, modelName: string): number {
  return MODEL_COSTS[modelName] ?? (platform === 'chat_gpt' ? 0.005 : 0.004)
}

export const PLATFORM_MODELS: Record<LLMPlatform, string> = {
  chat_gpt: 'gpt-4.1',
  gemini: 'gemini-2.5-flash',
}
