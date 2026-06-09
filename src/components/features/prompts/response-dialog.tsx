'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import { PositionCell } from './position-cell'
import { SentimentBadge } from './sentiment-badge'
import type { RunHistory } from '@/lib/queries/prompts'
import type { PromptTableRow } from '@/lib/queries/prompts'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createCompetitor } from '@/actions/competitors'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          AI Response Text
        </h4>
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
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
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

      {run.citations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sources ({run.citations.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {run.citations.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-muted/10 hover:bg-muted/20 border border-border/50 rounded-xl transition-colors">
                <span className="flex items-center justify-center text-[10px] font-bold text-muted-foreground bg-muted w-5 h-5 rounded-full shrink-0 mt-0.5 border border-border/80">
                  {c.position}
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
      )}
    </div>
  )
}

export function ResponseDialog({
  prompt,
  runs,
  open,
  onOpenChange,
  trackedBrandNames = [],
  initialDate = '',
  projectId,
}: ResponseDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Sync selectedDate with initialDate when the modal opens or initialDate changes
  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate || '')
    }
  }, [open, initialDate])

  // Get unique run dates from the runs list (in YYYY-MM-DD format)
  const runDates = Array.from(
    new Set(runs.map((r) => r.run_date.split('T')[0]))
  ).sort((a, b) => b.localeCompare(a))

  const dateToUse = selectedDate || runDates[0] || ''

  const currentChatGPT = runs.find(
    (r) => r.platform === 'chatgpt' && r.run_date.startsWith(dateToUse)
  )
  const currentGemini = runs.find(
    (r) => r.platform === 'gemini' && r.run_date.startsWith(dateToUse)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] md:w-[90vw] h-[85vh] max-h-[90vh] flex flex-col p-6 gap-4 overflow-hidden rounded-2xl shadow-2xl border border-border/80 bg-background">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl pr-6">
            {prompt.promptText}
          </DialogTitle>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {prompt.volume > 0 && (
              <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/40 border-border/60">
                {prompt.volume.toLocaleString()} searches/mo
              </Badge>
            )}
            <Badge variant="outline" className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100/60 text-sky-700 border-sky-200">
              {prompt.intent || 'informational'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="chatgpt" className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-2 mb-2 flex-shrink-0">
            <TabsList className="flex-shrink-0 justify-start bg-transparent rounded-none h-auto p-0 gap-6 border-none">
              <TabsTrigger
                value="chatgpt"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                ChatGPT
              </TabsTrigger>
              <TabsTrigger
                value="gemini"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                Gemini
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-1 py-1.5 rounded-none bg-transparent hover:text-foreground/80 font-medium text-sm transition-all cursor-pointer"
              >
                Side-by-Side
              </TabsTrigger>
            </TabsList>

            {runDates.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Scan Date:
                </span>
                <select
                  value={dateToUse}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-card hover:bg-muted/30 border border-border rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer transition-colors shadow-sm text-foreground"
                >
                  {runDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <TabsContent value="chatgpt" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentChatGPT} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          <TabsContent value="gemini" className="flex-1 min-h-0 overflow-y-auto pr-1 mt-0 focus-visible:outline-none">
            <ResponseContent run={currentGemini} trackedBrandNames={trackedBrandNames} projectId={projectId} />
          </TabsContent>

          <TabsContent value="compare" className="flex-1 min-h-0 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch min-h-0">
              <div className="flex flex-col min-h-0 h-full border-r border-border/40 pr-6 last:border-r-0 last:pr-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  ChatGPT
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  <ResponseContent run={currentChatGPT} trackedBrandNames={trackedBrandNames} projectId={projectId} />
                </div>
              </div>
              <div className="flex flex-col min-h-0 h-full">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  Gemini
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  <ResponseContent run={currentGemini} trackedBrandNames={trackedBrandNames} projectId={projectId} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
