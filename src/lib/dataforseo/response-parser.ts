export type MentionType = 'top_choice' | 'recommended' | 'mentioned_only'

export interface MentionParseResult {
  mentioned: boolean
  position: number | null
  snippet: string | null
  mentionType: MentionType | null
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

  if (!responseText) return { mentioned: false, position: null, snippet: null, mentionType: null }

  const lowerText = responseText.toLowerCase()
  const lowerBrand = brandName.toLowerCase()
  const lowerDomain = brandDomain.toLowerCase()

  // Check if brand is mentioned at all
  const mentioned =
    lowerText.includes(lowerBrand) || lowerText.includes(lowerDomain)

  if (!mentioned) return { mentioned: false, position: null, snippet: null, mentionType: null }

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

  let matchedSegment = ''
  if (!position) {
    const segmentIndex = segments.findIndex(
      (s) =>
        s.toLowerCase().includes(lowerBrand) ||
        s.toLowerCase().includes(lowerDomain)
    )
    position = segmentIndex >= 0 ? segmentIndex + 1 : 1
    matchedSegment = segmentIndex >= 0 ? segments[segmentIndex] : ''
  } else {
    // Brand was found in bold/list order
    // Let's find the actual segment containing this mention
    const segment = segments.find(
      (s) =>
        s.toLowerCase().includes(lowerBrand) ||
        s.toLowerCase().includes(lowerDomain)
    )
    matchedSegment = segment ?? ''
  }

  // Extract snippet: the sentence containing the brand mention
  const sentences = responseText.replace(/\*\*/g, '').split(/[.!?]+/)
  const snippetSentence = sentences.find(
    (s) =>
      s.toLowerCase().includes(lowerBrand) ||
      s.toLowerCase().includes(lowerDomain)
  )
  const snippet = snippetSentence?.trim().slice(0, 200) ?? null

  // Classification logic for mentionType
  const isListItem = /^\s*([-\*+•]|\d+[\s\.)])/.test(matchedSegment)
  const isHeading = matchedSegment.startsWith('#')
  const hasSuperlatives = /\b(best|winner|favorite|favourite|top pick|top choice|first choice|overall winner|highly recommend|our pick)\b/i.test(matchedSegment) ||
                          (snippet ? /\b(best|winner|favorite|favourite|top pick|top choice|first choice|overall winner|highly recommend|our pick)\b/i.test(snippet) : false)

  let mentionType: MentionType = 'mentioned_only'
  if (position === 1 && (isListItem || isHeading || hasSuperlatives)) {
    mentionType = 'top_choice'
  } else if (isListItem || isHeading) {
    mentionType = 'recommended'
  } else if (hasSuperlatives) {
    mentionType = 'top_choice'
  } else {
    mentionType = 'mentioned_only'
  }

  return { mentioned: true, position, snippet, mentionType }
}

export function parseCitations(
  annotations: Array<{ url: string; title: string; snippet: string }>
): CitationRow[] {
  const seenUrls = new Set<string>()
  const uniqueAnnotations = annotations.filter((a) => {
    if (!a.url) return false
    const normalizedUrl = a.url.trim().toLowerCase().replace(/\/$/, '')
    if (seenUrls.has(normalizedUrl)) return false
    seenUrls.add(normalizedUrl)
    return true
  })

  return uniqueAnnotations.map((a, index) => {
    let domain = ''
    try {
      domain = new URL(a.url).hostname.replace(/^www\./, '')
    } catch {
      domain = a.url
    }

    // Heuristic: If the domain parsed is a Google grounding API redirect domain,
    // and the title looks like a domain (e.g. "medicanimal.com"), use the title instead.
    if (
      (domain === 'vertexaisearch.cloud.google.com' || domain.includes('google.com')) &&
      a.title &&
      a.title.includes('.') &&
      !a.title.includes(' ')
    ) {
      domain = a.title.toLowerCase().trim()
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
