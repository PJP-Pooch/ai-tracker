'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import { PositionCell } from './position-cell'
import { SentimentBadge } from './sentiment-badge'
import type { RunHistory } from '@/lib/queries/prompts'
import type { PromptTableRow } from '@/lib/queries/prompts'
import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createCompetitor } from '@/actions/competitors'
import { deleteRunGroup } from '@/actions/prompts'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlignmentPanel } from './alignment-panel'

function extractDiscoveredBrands(rawResponse: string, trackedNames: string[]): string[] {
  const boldPattern = /\*\*([^*]{2,50})\*\*/g
  const found = new Set<string>()
  let match

  const actionVerbs = /^(identify|check|consider|evaluate|consult|compare|choose|select|avoid|look|keep|see|understand|learn|use|read|scan|ask|how|why|what|when|where|who)\b/i
  const allowedLowercase = new Set(['and', 'or', 'of', 'with', 'for', 'to', 'in', 'on', 'at', 'by', 'the', 'a', 'an', '&', 'de', 'la'])

  while ((match = boldPattern.exec(rawResponse)) !== null) {
    let name = match[1].trim()

    // Clean brackets/parentheses and contents (e.g. "Burns Original (Dry Food)" -> "Burns Original")
    name = name.replace(/\s*\([^)]*\)/g, '').trim()

    // Clean trailing colons and punctuation (e.g. "Poppy's Picnic:" -> "Poppy's Picnic")
    name = name.replace(/[:.,\-\s]+$/, '').trim()

    // 1. Skip short words & headings/guide sections
    if (
      name.length < 3 ||
      /^(best|top|overall|wet|dry|raw|fresh|note|tip|sensitive|hypoallergenic|specialized|excellent|other|puppy|puppies|vet|recommend|digest|ingredients|why|how|what|choose|select)/i.test(name)
    ) {
      continue
    }

    // 2. Skip instructional phrases
    if (actionVerbs.test(name)) continue

    // 3. Enforce Title Case (each word must start with an uppercase letter, number, or be an allowed lowercase connector)
    const words = name.split(/\s+/)
    if (words.length > 5) continue // Skip long sentences

    let isBrand = true
    for (const word of words) {
      const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
      if (!cleanWord || /^\d+$/.test(cleanWord)) continue

      const firstChar = cleanWord[0]
      if (firstChar && firstChar === firstChar.toLowerCase()) {
        if (!allowedLowercase.has(cleanWord.toLowerCase())) {
          isBrand = false
          break
        }
      }
    }

    if (!isBrand) continue

    const isTracked = trackedNames.some(
      (t) => t.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(t.toLowerCase())
    )
    if (!isTracked) found.add(name)
  }
  return Array.from(found)
}

interface ResponseDialogProps {
  prompt: PromptTableRow
  runs: RunHistory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  trackedBrandNames?: string[]
  initialDate?: string
  projectId: string
  alignmentCheckMode?: 'off' | 'manual' | 'auto'
}

function ResponseContent({
  run,
  trackedBrandNames = [],
  projectId,
}: {
  run: RunHistory | undefined
  trackedBrandNames?: string[]
  projectId: string
}) {
  const [localTrackedNames, setLocalTrackedNames] = useState<string[]>(trackedBrandNames)
  const [addingBrand, setAddingBrand] = useState<{ name: string; domain: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setLocalTrackedNames(trackedBrandNames)
  }, [trackedBrandNames])

  if (!run) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/60">
        No data available for this platform on this scan date.
      </div>
    )
  }

  const discoveredBrands = run.raw_response
    ? extractDiscoveredBrands(run.raw_response, localTrackedNames)
    : []

  const activeMentions = run.mentions.filter((m) => m.mentioned)

  const brandsInOrder = useMemo(() => {
    if (!run?.raw_response) return []
    const responseText = run.raw_response
    const brandPattern = /\*\*([^*]+)\*\*|^[-\d]+\.\s+([^\n]+)/gm
    const list: string[] = []
    let match
    
    const regex = new RegExp(brandPattern)
    while ((match = regex.exec(responseText)) !== null) {
      const name = (match[1] || match[2] || '').trim()
      const cleaned = name.replace(/\s*\([^)]*\)/g, '').replace(/[:.,\-\s]+$/, '').trim().toLowerCase()
      if (
        cleaned.length >= 2 &&
        !/^(best|top|overall|wet|dry|raw|fresh|note|tip|sensitive|hypoallergenic|specialized|excellent|other|puppy|puppies|vet|recommend|digest|ingredients|why|how|what|choose|select)/i.test(cleaned)
      ) {
        if (!list.includes(cleaned)) {
          list.push(cleaned)
        }
      }
    }
    return list
  }, [run?.raw_response])

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/40 inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {new Date(run.run_date).toLocaleString()} · <span className="uppercase font-semibold tracking-wider text-[10px]">{run.platform}</span>
      </div>

      {activeMentions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tracked Brand Mentions
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeMentions.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs bg-card hover:bg-muted/40 transition-colors px-2.5 py-1.5 rounded-lg border border-border/80 shadow-sm">
                <span className="font-semibold text-foreground">{m.brands?.name || 'Tracked Brand'}</span>
                <span className="w-px h-3 bg-border" />
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-[10px] uppercase font-medium">Pos</span>
                  <PositionCell position={m.position} mentioned={m.mentioned} />
                </span>
                <span className="w-px h-3 bg-border" />
                <SentimentBadge sentiment={m.sentiment as 'positive' | 'neutral' | 'negative' | null} />
              </span>
            ))}
          </div>
        </div>
      )}

      {discoveredBrands.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Also Mentioned ({discoveredBrands.length})
          </h4>
          <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-300">
            {discoveredBrands.map((name) => (
              <Badge key={name} variant="outline" className="text-xs bg-muted/20 border-border/80 px-2 py-0.5 rounded-md text-foreground/80 flex items-center gap-1 group">
                {name}
                <button
                  onClick={() => setAddingBrand({ name, domain: '' })}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground rounded p-0.5 ml-0.5 transition-colors focus:outline-none cursor-pointer"
                  title={`Track ${name} as competitor`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {addingBrand && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsSubmitting(true)
                setSubmitError(null)
                try {
                  const formData = new FormData()
                  formData.append('name', addingBrand.name)
                  formData.append('domain', addingBrand.domain)
                  const result = await createCompetitor(projectId, formData)
                  if (result?.error) {
                    setSubmitError(result.error)
                  } else {
                    setLocalTrackedNames((prev) => [...prev, addingBrand.name])
                    setAddingBrand(null)
                    router.refresh()
                  }
                } catch (err) {
                  setSubmitError(err instanceof Error ? err.message : 'Failed to track competitor')
                } finally {
                  setIsSubmitting(false)
                }
              }}
              className="bg-muted/40 p-4 rounded-xl border border-border/60 space-y-3 mt-3 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Track competitor "{addingBrand.name}"</span>
                {submitError && <span className="text-red-500 font-normal">{submitError}</span>}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1 w-full">
                  <Label htmlFor="competitor-domain" className="text-[10px] uppercase font-bold text-muted-foreground">
                    Domain name
                  </Label>
                  <Input
                    id="competitor-domain"
                    type="text"
                    value={addingBrand.domain}
                    onChange={(e) => setAddingBrand({ ...addingBrand, domain: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground h-8"
                    placeholder="e.g. competitor.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddingBrand(null)
                      setSubmitError(null)
                    }}
                    size="sm"
                    className="h-8 text-xs px-3 py-1 font-medium transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="h-8 text-xs px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Tracking...' : 'Track Competitor'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            AI Response Text
          </h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground select-none">
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center px-1 text-[8px] font-bold rounded border bg-primary/5 text-primary border-primary/30 font-mono">#1</span>
              <span>Tracked Brand</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center px-1 text-[8px] font-bold rounded border bg-muted/20 text-muted-foreground border-border/80 font-mono">#1</span>
              <span>Discovered Brand</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Positive</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Neutral</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Negative</span>
            </span>
          </div>
        </div>
        {run.raw_response ? (
          <div className="text-sm text-foreground/90 bg-muted/20 rounded-xl p-5 border border-border/60 leading-relaxed font-sans overflow-hidden">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 first:mt-0 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0 text-foreground">{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => {
                  const textContent = String(children).trim()
                  const cleanBold = textContent.replace(/\s*\([^)]*\)/g, '').replace(/[:.,\-\s]+$/, '').trim().toLowerCase()
                  
                  if (!cleanBold || cleanBold.length < 2) {
                    return <strong className="font-bold text-foreground">{children}</strong>
                  }

                  // 1. Check if it matches any tracked brand in the run mentions
                  const dbMention = run.mentions?.find((m) => {
                    if (!m.mentioned || !m.brands?.name) return false
                    const bName = m.brands.name.toLowerCase()
                    return cleanBold === bName || cleanBold.includes(bName) || bName.includes(cleanBold)
                  })

                  let position = dbMention?.position
                  let isTracked = !!dbMention
                  let sentiment = dbMention?.sentiment

                  // 2. If not a tracked brand mention, look it up in the overall brandsInOrder list
                  if (!isTracked) {
                    const isGenericWord = /^(best|top|overall|wet|dry|raw|fresh|note|tip|sensitive|hypoallergenic|specialized|excellent|other|puppy|puppies|vet|recommend|digest|ingredients|why|how|what|choose|select)/i.test(cleanBold)
                    if (!isGenericWord) {
                      const idx = brandsInOrder.findIndex((name) => 
                        cleanBold === name || cleanBold.includes(name) || name.includes(cleanBold)
                      )
                      if (idx >= 0) {
                        position = idx + 1
                      }
                    }
                  }

                  if (position != null) {
                    const badgeColor =
                      position === 1
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                        : position === 2
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : position === 3
                            ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : position <= 5
                              ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                              : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'

                    return (
                      <strong className="font-bold text-foreground inline-flex items-center gap-1.5 relative group/brand">
                        {children}
                        <span
                          className={cn(
                            'inline-flex items-center justify-center gap-1 px-1.5 py-0.25 text-[10px] font-bold rounded border shrink-0 font-mono select-none transition-all',
                            badgeColor,
                            isTracked 
                              ? 'ring-1 ring-primary/25 shadow-sm scale-105 border-primary/30' 
                              : 'opacity-85'
                          )}
                          title={`${isTracked ? 'Tracked Brand' : 'Discovered Brand'} · Rank #${position}`}
                        >
                          #{position}
                          {isTracked && sentiment && (
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full shrink-0',
                                sentiment === 'positive'
                                  ? 'bg-emerald-500'
                                  : sentiment === 'neutral'
                                    ? 'bg-zinc-400'
                                    : 'bg-rose-500'
                              )}
                            />
                          )}
                        </span>
                      </strong>
                    )
                  }

                  return <strong className="font-bold text-foreground">{children}</strong>
                },
              }}
            >
              {run.raw_response}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/60">
            No response text recorded.
          </div>
        )}
      </div>

      {/* Scraper Structured Data (Ads, Products, Local Map Listings) */}
      {(() => {
        const ads = run.scraper_payload?.ads ?? []
        const products = run.scraper_payload?.products ?? []
        const localBusinesses = run.scraper_payload?.local_businesses ?? []

        if (ads.length === 0 && products.length === 0 && localBusinesses.length === 0) return null

        return (
          <div className="space-y-6 pt-2 border-t border-border/40">
            {/* Sponsored Ads */}
            {ads.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Sponsored Search Ads ({ads.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ads.map((ad: any, i: number) => (
                    <div key={i} className="flex flex-col p-4 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl hover:border-amber-500/25 transition-all shadow-sm group">
                      <div className="flex items-center gap-2 mb-2">
                        {ad.advertiser?.favicon_url ? (
                          <img src={ad.advertiser.favicon_url} alt="" className="w-4 h-4 rounded" />
                        ) : (
                          <span className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950/40 text-[9px] font-bold text-amber-600 flex items-center justify-center">Ad</span>
                        )}
                        <span className="text-xs font-semibold text-foreground/80 truncate">{ad.advertiser?.name || ad.domain}</span>
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">Sponsored</span>
                      </div>
                      <a
                        href={ad.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:underline group-hover:text-primary/95 line-clamp-1 mb-1"
                      >
                        {ad.title}
                      </a>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ad.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products & Shopping */}
            {products.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Product & Shopping Listings ({products.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {products.map((p: any, i: number) => {
                    const formattedPrice = p.price != null ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: p.currency || 'USD',
                    }).format(p.price) : null

                    return (
                      <div key={i} className="flex flex-col bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-border/100 transition-all group">
                        {p.images?.[0] && (
                          <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center p-2 overflow-hidden border-b border-border/40">
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            {p.tag && (
                              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                {p.tag}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                          <div>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-foreground hover:text-primary line-clamp-2 leading-snug"
                            >
                              {p.title}
                            </a>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{p.domain || p.merchants}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="text-sm font-bold text-foreground">{formattedPrice || 'N/A'}</span>
                            {p.rating != null && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-1.5 py-0.25 rounded-md">
                                ★ {typeof p.rating === 'object' ? p.rating?.value ?? 0 : p.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Local Businesses */}
            {localBusinesses.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Local Map Listings ({localBusinesses.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localBusinesses.map((b: any, i: number) => {
                    const ratingVal = typeof b.rating === 'object' ? b.rating?.value : b.rating
                    const votes = typeof b.rating === 'object' ? b.rating?.votes_count : b.reviews_count

                    return (
                      <div key={i} className="flex flex-col p-4 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-xl hover:border-emerald-500/25 transition-all shadow-sm group">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h5 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {b.url ? (
                              <a href={b.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {b.title}
                              </a>
                            ) : (
                              b.title
                            )}
                          </h5>
                          {ratingVal != null && (
                            <div className="flex items-center gap-1 shrink-0 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-500">
                              <span>★ {ratingVal}</span>
                              {votes != null && <span className="text-[10px] text-muted-foreground font-normal font-sans">({votes})</span>}
                            </div>
                          )}
                        </div>
                        {b.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{b.description}</p>}
                        <div className="mt-auto space-y-1 text-[11px] text-muted-foreground">
                          {b.address && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">📍</span>
                              <span className="truncate">{b.address}</span>
                            </div>
                          )}
                          {b.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">📞</span>
                              <span>{b.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {run.citations.length > 0 && (() => {
        const seen = new Set<string>()
        const uniqueCitations = run.citations.filter((c) => {
          const url = c.url?.trim().toLowerCase().replace(/\/$/, '')
          if (!url) return false
          if (seen.has(url)) return false
          seen.add(url)
          return true
        })

        if (uniqueCitations.length === 0) return null

        return (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sources ({uniqueCitations.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {uniqueCitations.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-muted/10 hover:bg-muted/20 border border-border/50 rounded-xl transition-colors">
                  <span className="flex items-center justify-center text-[10px] font-bold text-muted-foreground bg-muted w-5 h-5 rounded-full shrink-0 mt-0.5 border border-border/80">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline truncate block"
                    >
                      {c.title || c.domain}
                    </a>
                    <span className="text-[10px] text-muted-foreground">{c.domain}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

interface RunGroup {
  id: string
  dateStr: string
  displayLabel: string
  chatgptRun?: RunHistory
  geminiRun?: RunHistory
  chatgptScraperRun?: RunHistory
  geminiScraperRun?: RunHistory
}

function getRunGroups(runs: RunHistory[]): RunGroup[] {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime()
  )

  const groups: RunGroup[] = []

  for (const run of sorted) {
    const runTime = new Date(run.run_date).getTime()

    // Find group within 3 minutes threshold
    const match = groups.find((g) => {
      const gTime = new Date(g.id).getTime()
      return Math.abs(gTime - runTime) <= 3 * 60 * 1000
    })

    if (match) {
      if (run.platform === 'chatgpt' && !match.chatgptRun) {
        match.chatgptRun = run
      } else if (run.platform === 'gemini' && !match.geminiRun) {
        match.geminiRun = run
      } else if (run.platform === 'chatgpt_scraper' && !match.chatgptScraperRun) {
        match.chatgptScraperRun = run
      } else if (run.platform === 'gemini_scraper' && !match.geminiScraperRun) {
        match.geminiScraperRun = run
      }
    } else {
      const date = new Date(run.run_date)
      const displayLabel = date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      groups.push({
        id: run.run_date,
        dateStr: run.run_date.split('T')[0],
        displayLabel,
        chatgptRun: run.platform === 'chatgpt' ? run : undefined,
        geminiRun: run.platform === 'gemini' ? run : undefined,
        chatgptScraperRun: run.platform === 'chatgpt_scraper' ? run : undefined,
        geminiScraperRun: run.platform === 'gemini_scraper' ? run : undefined,
      })
    }
  }

  return groups
}

const intentColors: Record<string, string> = {
  transactional: 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
  commercial: 'bg-purple-100/60 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50',
  informational: 'bg-sky-100/60 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50',
}

export function ResponseDialog({
  prompt,
  runs,
  open,
  onOpenChange,
  trackedBrandNames = [],
  initialDate = '',
  projectId,
  alignmentCheckMode = 'off',
}: ResponseDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()

  const runGroups = getRunGroups(runs)

  // Sync selectedGroupId with initialDate when the modal opens or initialDate changes
  useEffect(() => {
    if (open) {
      if (initialDate) {
        const matched = runGroups.find(
          (g) =>
            g.chatgptRun?.run_date === initialDate ||
            g.geminiRun?.run_date === initialDate ||
            g.chatgptScraperRun?.run_date === initialDate ||
            g.geminiScraperRun?.run_date === initialDate ||
            g.id === initialDate ||
            g.dateStr === initialDate
        )
        setSelectedGroupId(matched ? matched.id : (runGroups[0]?.id || ''))
      } else {
        setSelectedGroupId(runGroups[0]?.id || '')
      }
    }
  }, [open, initialDate, runs])

  const groupToUse = runGroups.find(g => g.id === selectedGroupId) || runGroups[0]

  const currentChatGPT = groupToUse?.chatgptRun
  const currentGemini = groupToUse?.geminiRun
  const currentChatGPTScraper = groupToUse?.chatgptScraperRun
  const currentGeminiScraper = groupToUse?.geminiScraperRun

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] md:w-[90vw] h-[85vh] max-h-[90vh] flex flex-col p-6 gap-4 overflow-hidden rounded-2xl shadow-2xl border border-border/80 bg-background">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl pr-6 whitespace-normal break-words">
            {prompt.promptText}
          </DialogTitle>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {prompt.volume > 0 && (
              <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/40 border-border/60">
                {prompt.volume.toLocaleString()} searches/mo
              </Badge>
            )}
            <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 rounded-full text-xs font-medium", intentColors[prompt.intent || 'informational'])}>
              {prompt.intent || 'informational'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="chatgpt" className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-2 mb-2 flex-shrink-0">
            <TabsList className="flex-shrink-0 justify-start bg-transparent rounded-none h-auto p-0 gap-4 sm:gap-6 border-none flex-wrap">
              <TabsTrigger
                value="chatgpt"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                ChatGPT
              </TabsTrigger>
              <TabsTrigger
                value="chatgpt_scraper"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                ChatGPT Scraper
              </TabsTrigger>
              <TabsTrigger
                value="gemini"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                Gemini
              </TabsTrigger>
              <TabsTrigger
                value="gemini_scraper"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                Gemini Scraper
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                Side-by-Side
              </TabsTrigger>
              {alignmentCheckMode !== 'off' && (
                <TabsTrigger
                  value="alignment"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
                >
                  Alignment
                </TabsTrigger>
              )}
            </TabsList>

            {runGroups.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-sans">
                  Scan Date:
                </span>
                <select
                  value={groupToUse?.id || ''}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value)
                    setConfirmDelete(false)
                  }}
                  className="bg-card hover:bg-muted/30 border border-border rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer transition-colors shadow-sm text-foreground"
                >
                  {runGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.displayLabel}
                    </option>
                  ))}
                </select>

                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                    <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider font-sans">Confirm?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-[10px] font-bold"
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true)
                        try {
                          const runIds = [
                            currentChatGPT?.id,
                            currentGemini?.id,
                            currentChatGPTScraper?.id,
                            currentGeminiScraper?.id,
                          ].filter(Boolean) as string[]
                          if (runIds.length > 0) {
                            const res = await deleteRunGroup(runIds, projectId)
                            if (res?.error) {
                              toast.error(res.error)
                            } else {
                              toast.success('Scan run deleted successfully')
                              onOpenChange(false)
                              router.refresh()
                            }
                          }
                        } catch (err) {
                          toast.error('Failed to delete scan run')
                        } finally {
                          setIsDeleting(false)
                          setConfirmDelete(false)
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px] font-medium"
                      disabled={isDeleting}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 p-0 rounded-lg shrink-0"
                    title="Delete this scan run"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-rose-500 transition-colors" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="chatgpt" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentChatGPT} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          <TabsContent value="chatgpt_scraper" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentChatGPTScraper} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          <TabsContent value="gemini" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentGemini} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          <TabsContent value="gemini_scraper" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentGeminiScraper} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          {alignmentCheckMode !== 'off' && (
            <TabsContent value="alignment" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
              <div className="space-y-5 pt-1">
                {(() => {
                  const activeRuns = [
                    { label: 'ChatGPT', run: currentChatGPT, color: 'bg-emerald-500' },
                    { label: 'ChatGPT Scraper', run: currentChatGPTScraper, color: 'bg-emerald-600' },
                    { label: 'Gemini', run: currentGemini, color: 'bg-blue-500' },
                    { label: 'Gemini Scraper', run: currentGeminiScraper, color: 'bg-blue-600' },
                  ].filter((item) => !!item.run)

                  return (
                    <div className={cn(
                      "grid gap-6",
                      activeRuns.length >= 3 ? "grid-cols-1 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
                    )}>
                      {activeRuns.map(({ label, run, color }) => (
                        <div key={label}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", color)} />
                            {label}
                          </h4>
                          <AlignmentPanel runId={run?.id} checkMode={alignmentCheckMode} />
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </TabsContent>
          )}

          <TabsContent value="compare" className="flex-1 min-h-0 mt-0 focus-visible:outline-none">
            {(() => {
              const activeRuns = [
                { label: 'ChatGPT', run: currentChatGPT, color: 'bg-emerald-500 shadow-emerald-500/50' },
                { label: 'ChatGPT Scraper', run: currentChatGPTScraper, color: 'bg-emerald-600 shadow-emerald-600/50' },
                { label: 'Gemini', run: currentGemini, color: 'bg-blue-500 shadow-blue-500/50' },
                { label: 'Gemini Scraper', run: currentGeminiScraper, color: 'bg-blue-600 shadow-blue-600/50' },
              ].filter((item) => !!item.run)

              return (
                <div className={cn(
                  "grid gap-6 h-full items-stretch min-h-0",
                  activeRuns.length === 4
                    ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
                    : activeRuns.length === 3
                      ? "grid-cols-1 lg:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
                )}>
                  {activeRuns.map(({ label, run, color }, index) => (
                    <div key={label} className={cn(
                      "flex flex-col min-h-0 h-full",
                      index < activeRuns.length - 1 && "lg:border-r lg:border-border/40 lg:pr-6"
                    )}>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full shadow-sm", color)} />
                        {label}
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                        <ResponseContent run={run} trackedBrandNames={trackedBrandNames} projectId={projectId} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
