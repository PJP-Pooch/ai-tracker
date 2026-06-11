import OpenAI from 'openai'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export type AlignmentVerdict = 'confirmed' | 'contradicted' | 'not_found'

export interface AlignmentClaim {
  ai_claim: string
  verdict: AlignmentVerdict
  explanation: string
  source_url: string | null
  source_quote: string | null
}

export async function extractBrandClaims(rawResponse: string, brandName: string): Promise<string[]> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `Extract specific, verifiable factual claims about the brand "${brandName}" from this AI response. Only include claims directly about ${brandName} — not general statements or claims about other brands. Each claim should be a short phrase (e.g. "sells dry dog food", "focused on gut health", "ships across the UK"). Return JSON: { "claims": string[] }. Return an empty array if the brand is not meaningfully described.`,
      },
      {
        role: 'user',
        content: rawResponse.slice(0, 4000),
      },
    ],
    response_format: { type: 'json_object' },
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as { claims?: string[] }
    return Array.isArray(parsed.claims) ? parsed.claims.slice(0, 8) : []
  } catch {
    return []
  }
}

export async function verifyClaimAgainstContent(
  claim: string,
  brandName: string,
  pageUrl: string,
  pageContent: string
): Promise<{ verdict: AlignmentVerdict; explanation: string; source_quote: string | null }> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are verifying whether a claim about a brand is supported by their website content.

Verdicts:
- "confirmed": the website clearly supports or aligns with this claim
- "contradicted": the website directly contradicts this claim (e.g. AI says raw food, website says dry food)
- "not_found": the website doesn't mention this topic either way

Return JSON: { "verdict": "confirmed"|"contradicted"|"not_found", "explanation": string (1 sentence), "source_quote": string|null (direct quote from content that supports the verdict, or null) }`,
      },
      {
        role: 'user',
        content: `Brand: ${brandName}
Claim from AI: "${claim}"
Website URL: ${pageUrl}

Website content:
${pageContent.slice(0, 2000)}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as {
      verdict?: string
      explanation?: string
      source_quote?: string | null
    }
    const validVerdicts: AlignmentVerdict[] = ['confirmed', 'contradicted', 'not_found']
    return {
      verdict: validVerdicts.includes(parsed.verdict as AlignmentVerdict)
        ? (parsed.verdict as AlignmentVerdict)
        : 'not_found',
      explanation: parsed.explanation ?? '',
      source_quote: parsed.source_quote ?? null,
    }
  } catch {
    return { verdict: 'not_found', explanation: '', source_quote: null }
  }
}

export async function summarisePageAsBrandBrief(
  pageMarkdown: string,
  brandName: string
): Promise<string> {
  const client = getClient()

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are writing a brand positioning brief based on a homepage. Summarise what this brand is, what they sell, their key differentiators, and what they are NOT. Write in plain declarative sentences, 3-5 sentences max. This brief will be used to check whether AI-generated descriptions of the brand are accurate.`,
      },
      {
        role: 'user',
        content: `Brand: ${brandName}\n\nHomepage content:\n${pageMarkdown.slice(0, 3000)}`,
      },
    ],
  })

  return response.choices[0].message.content?.trim() ?? ''
}
