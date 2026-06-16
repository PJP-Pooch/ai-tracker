'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { TrendingUp, Plus, CheckCircle2, Loader2, AlertCircle, Square, CheckSquare, BarChart2 } from 'lucide-react'
import { bulkCreatePromptsWithOptions } from '@/actions/prompts'
import type { AIKeywordVolumeItem } from '@/lib/dataforseo/ai-keyword-data'

const MARKETS = [
  { label: 'United States', locationCode: 2840, languageCode: 'en' },
  { label: 'United Kingdom', locationCode: 2826, languageCode: 'en' },
  { label: 'Australia', locationCode: 2036, languageCode: 'en' },
  { label: 'Canada', locationCode: 2124, languageCode: 'en' },
  { label: 'Germany', locationCode: 2276, languageCode: 'de' },
  { label: 'France', locationCode: 2250, languageCode: 'fr' },
  { label: 'Spain', locationCode: 2724, languageCode: 'es' },
  { label: 'Italy', locationCode: 2380, languageCode: 'it' },
  { label: 'Netherlands', locationCode: 2528, languageCode: 'nl' },
  { label: 'Sweden', locationCode: 2752, languageCode: 'sv' },
] as const

function formatVolume(v: number | null) {
  if (v === null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toString()
}

interface PromptResearchProps {
  projectId: string
}

export function PromptResearch({ projectId }: PromptResearchProps) {
  const [bulkText, setBulkText] = useState('')
  const [marketKey, setMarketKey] = useState('2840')
  const [results, setResults] = useState<AIKeywordVolumeItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isChecking, setIsChecking] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedCount, setAddedCount] = useState<number | null>(null)
  const [hasChecked, setHasChecked] = useState(false)

  const selectedMarket = MARKETS.find(m => String(m.locationCode) === marketKey) ?? MARKETS[0]

  const parsedKeywords = bulkText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (parsedKeywords.length === 0) return

    setIsChecking(true)
    setError(null)
    setResults([])
    setSelected(new Set())
    setAddedCount(null)
    setHasChecked(true)

    try {
      const res = await fetch('/api/prompt-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: parsedKeywords,
          locationCode: selectedMarket.locationCode,
          languageCode: selectedMarket.languageCode,
        }),
      })

      const data = await res.json() as { results?: AIKeywordVolumeItem[]; error?: string }

      if (!res.ok || data.error) {
        setError(data.error ?? 'Volume check failed. Please try again.')
        return
      }

      setResults(data.results ?? [])
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsChecking(false)
    }
  }

  function toggleSelect(kw: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(kw)) next.delete(kw)
      else next.add(kw)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map(r => r.keyword)))
  }

  async function handleAddToProject() {
    if (selected.size === 0) return
    setIsAdding(true)
    setAddedCount(null)

    const toAdd = results
      .filter(r => selected.has(r.keyword))
      .map(r => ({
        prompt_text: r.keyword,
        intent: 'informational' as const,
        priority: 'medium' as const,
        volume: r.ai_search_volume ?? 0,
      }))

    const result = await bulkCreatePromptsWithOptions(projectId, toAdd)

    if (result?.error) {
      setError(result.error)
    } else {
      setAddedCount(result.count ?? toAdd.length)
      setSelected(new Set())
    }

    setIsAdding(false)
  }

  const allSelected = results.length > 0 && selected.size === results.length
  const someSelected = selected.size > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-5">
              <form onSubmit={handleCheck} className="flex flex-col gap-4 h-full">
                <div className="space-y-1.5">
                  <Label>Market</Label>
                  <Select value={marketKey} onValueChange={(v) => { if (v) setMarketKey(v) }} disabled={isChecking}>
                    <SelectTrigger>
                      <SelectValue>{selectedMarket.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.map(m => (
                        <SelectItem key={m.locationCode} value={String(m.locationCode)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulk-keywords">Keywords / Prompts</Label>
                    {parsedKeywords.length > 0 && (
                      <span className="text-xs text-muted-foreground">{parsedKeywords.length} entered</span>
                    )}
                  </div>
                  <Textarea
                    id="bulk-keywords"
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={"best dog food UK\ndog food for sensitive stomachs\nhealthy dog food\ngut health dog food"}
                    rows={12}
                    disabled={isChecking}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">One keyword or prompt per line. Up to 1,000.</p>
                </div>

                <Button
                  type="submit"
                  disabled={parsedKeywords.length === 0 || isChecking}
                  className="gradient-indigo w-full"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking volumes...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Check AI Volumes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success banner */}
          {addedCount !== null && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {addedCount} prompt{addedCount !== 1 ? 's' : ''} added to your project and ready to track.
            </div>
          )}

          {/* Results table */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                    <span className="text-muted-foreground font-normal ml-1">· {selectedMarket.label}</span>
                  </p>
                  {someSelected && (
                    <Badge variant="secondary" className="text-xs">
                      {selected.size} selected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-indigo"
                    disabled={!someSelected || isAdding}
                    onClick={handleAddToProject}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {someSelected ? `${selected.size} ` : ''}to Project
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="w-10 px-4 py-3 text-left">
                        <button
                          onClick={toggleAll}
                          aria-label="Select all"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prompt / Keyword</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground w-40">
                        <span className="flex items-center justify-end gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          AI Monthly Searches
                        </span>
                      </th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((item) => {
                      const isSelected = selected.has(item.keyword)
                      return (
                        <tr
                          key={item.keyword}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : 'hover:bg-muted/30'
                          }`}
                          onClick={() => toggleSelect(item.keyword)}
                        >
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelect(item.keyword)}
                              aria-label={`Select ${item.keyword}`}
                              className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">{item.keyword}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {item.ai_search_volume !== null ? (
                              <span className="font-semibold text-foreground">
                                {formatVolume(item.ai_search_volume)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!isSelected) toggleSelect(item.keyword)
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-indigo-600 transition-colors"
                              title="Select to add"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {hasChecked && !isChecking && results.length === 0 && !error && (
            <div className="text-center py-20 text-muted-foreground">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No data returned</p>
              <p className="text-sm mt-1">Try different keywords or a different market.</p>
            </div>
          )}

          {/* Initial state */}
          {!hasChecked && (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-lg">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Paste your keywords to check AI search volumes</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                Enter one keyword or prompt per line, select your market, and hit &ldquo;Check AI Volumes&rdquo;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
