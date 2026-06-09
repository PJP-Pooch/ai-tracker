export interface MentionParseResult {
  mentioned: boolean
  position: number | null
  snippet: string | null
}

export interface CitationRow {
  domain: string
  url: string
  title: string
  snippet: string
  position: number
}

// Extracts brand mention data from raw LLM response text.
// Position is determined by paragraph order — which paragraph first names the brand.
export function parseMentions(params: {
  responseText: string
  brandName: string
  brandDomain: string
}): MentionParseResult {
  const { responseText, brandName, brandDomain } = params

  if (!responseText) return { mentioned: false, position: null, snippet: null }

  const lowerText = responseText.toLowerCase()
  const lowerBrand = brandName.toLowerCase()
  const lowerDomain = brandDomain.toLowerCase()

  // Check if brand is mentioned at all
  const mentioned =
    lowerText.includes(lowerBrand) || lowerText.includes(lowerDomain)

  if (!mentioned) return { mentioned: false, position: null, snippet: null }

  // Find position: which brand-like segment (paragraph or list item) first mentions the brand
  // Split by newlines or numbered list markers
  const segments = responseText
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Track all brand names encountered in order (rough heuristic for position)
  const brandPattern = /\*\*([^*]+)\*\*|^[-\d]+\.\s+([^\n]+)/gm
  const brandsInOrder: string[] = []
  let match

  while ((match = brandPattern.exec(responseText)) !== null) {
    const name = (match[1] || match[2] || '').trim().toLowerCase()
    if (name && !brandsInOrder.includes(name)) {
      brandsInOrder.push(name)
    }
  }

  const positionInBoldList = brandsInOrder.findIndex(
    (n) => n.includes(lowerBrand) || lowerBrand.includes(n.split(' ')[0])
  )

  // Fall back to paragraph position if not in a list
  let position = positionInBoldList >= 0 ? positionInBoldList + 1 : null

  if (!position) {
    const segmentIndex = segments.findIndex(
      (s) =>
        s.toLowerCase().includes(lowerBrand) ||
        s.toLowerCase().includes(lowerDomain)
    )
    position = segmentIndex >= 0 ? segmentIndex + 1 : 1
  }

  // Extract snippet: the sentence containing the brand mention
  const sentences = responseText.replace(/\*\*/g, '').split(/[.!?]+/)
  const snippetSentence = sentences.find(
    (s) =>
      s.toLowerCase().includes(lowerBrand) ||
      s.toLowerCase().includes(lowerDomain)
  )
  const snippet = snippetSentence?.trim().slice(0, 200) ?? null

  return { mentioned: true, position, snippet }
}

export function parseCitations(
  annotations: Array<{ url: string; title: string; snippet: string }>
): CitationRow[] {
  return annotations.map((a, index) => {
    let domain = ''
    try {
      domain = new URL(a.url).hostname.replace(/^www\./, '')
    } catch {
      domain = a.url
    }
    return {
      domain,
      url: a.url,
      title: a.title || '',
      snippet: a.snippet || '',
      position: index + 1,
    }
  })
}
