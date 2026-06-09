import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface SentimentResult {
  sentiment: Sentiment
  reason: string
}

interface BatchInput {
  brandName: string
  snippet: string
}

// Batch up to 10 snippets in a single API call to minimize cost.
// Uses gpt-4o-mini (~$0.0001 per snippet).
export async function analyzeSentimentBatch(
  items: BatchInput[]
): Promise<SentimentResult[]> {
  if (items.length === 0) return []

  const client = getClient()

  const prompt = items
    .map(
      (item, i) =>
        `${i + 1}. Brand: "${item.brandName}"\nContext: "${item.snippet}"`
    )
    .join('\n\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a brand sentiment analyzer. For each item, classify the sentiment as "positive", "neutral", or "negative" based on how the brand is described in the context. Respond with a JSON array where each element has "sentiment" and "reason" fields (reason is a short phrase, max 10 words).',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
    const results: Array<{ sentiment: string; reason: string }> =
      parsed.results ?? parsed.items ?? []

    return items.map((_, i) => ({
      sentiment: (['positive', 'neutral', 'negative'].includes(results[i]?.sentiment)
        ? results[i].sentiment
        : 'neutral') as Sentiment,
      reason: results[i]?.reason ?? '',
    }))
  } catch {
    // Fallback: return neutral for all if parsing fails
    return items.map(() => ({ sentiment: 'neutral' as Sentiment, reason: '' }))
  }
}

export async function analyzeSentiment(
  snippet: string,
  brandName: string
): Promise<SentimentResult> {
  const results = await analyzeSentimentBatch([{ snippet, brandName }])
  return results[0]
}
