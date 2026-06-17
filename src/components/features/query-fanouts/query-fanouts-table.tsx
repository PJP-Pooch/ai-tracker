'use client'

import { useState, useMemo, Fragment, useCallback } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Search, Sparkles, Link as LinkIcon, RefreshCw } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import type { QueryFanoutGroup } from '@/lib/queries/query-fanouts'

interface QueryFanoutsTableProps {
  data: QueryFanoutGroup[]
}

interface RecheckState {
  rank: number | null
  url: string | null
  loading: boolean
  error: string | null
}

export function QueryFanoutsTable({ data }: QueryFanoutsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({})
  const [recheckState, setRecheckState] = useState<Record<string, RecheckState>>({})

  const handleRecheck = useCallback(async (query: string, runId: string, projectId: string) => {
    const key = `${runId}::${query}`
    setRecheckState((prev) => ({
      ...prev,
      [key]: { rank: prev[key]?.rank ?? null, url: prev[key]?.url ?? null, loading: true, error: null },
    }))
    try {
      const res = await fetch('/api/recheck-serp-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, runId, projectId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Recheck failed')
      setRecheckState((prev) => ({
        ...prev,
        [key]: { rank: json.rank_group, url: json.ranked_url, loading: false, error: null },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setRecheckState((prev) => ({
        ...prev,
        [key]: { rank: prev[key]?.rank ?? null, url: prev[key]?.url ?? null, loading: false, error: msg },
      }))
    }
  }, [])

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    data.forEach((item) => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [data])

  // Toggle row expansion
  const toggleExpand = (promptId: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [promptId]: !prev[promptId],
    }))
  }

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.promptText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variations.some((v) => v.query.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [data, searchTerm, categoryFilter])

  // Aggregate project statistics
  const stats = useMemo(() => {
    let totalVariations = 0
    let totalRankedInTop10 = 0
    let rankedAvgRanks: number[] = []

    filteredData.forEach((group) => {
      totalVariations += group.fanoutCount
      totalRankedInTop10 += group.top10Count
      group.variations.forEach((v) => {
        if (v.avgRank !== null) {
          rankedAvgRanks.push(v.avgRank)
        }
      })
    })

    const averageRank = rankedAvgRanks.length > 0
      ? rankedAvgRanks.reduce((sum, r) => sum + r, 0) / rankedAvgRanks.length
      : null

    const visibilityRate = totalVariations > 0
      ? (totalRankedInTop10 / totalVariations) * 100
      : 0

    return {
      totalVariations,
      totalRankedInTop10,
      averageRank,
      visibilityRate,
    }
  }, [filteredData])

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total Fanout Queries
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{stats.totalVariations}</span>
            <span className="text-xs text-muted-foreground">variations tracked</span>
          </div>
        </Card>

        <Card className="p-5 border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Top 10 Visibility
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.visibilityRate.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({stats.totalRankedInTop10} of {stats.totalVariations} ranked)
            </span>
          </div>
        </Card>

        <Card className="p-5 border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Average Rank (Top 10)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.averageRank !== null ? stats.averageRank.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-muted-foreground">avg organic position</span>
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-card p-4 border rounded-xl">
        <div className="flex-1 max-w-sm space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Search Queries
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search main prompts or fanouts…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Filter by Category
          </label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || 'all')}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8" />
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 w-[380px] max-w-[380px]">
                Main Prompt / Scraper Keyword
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider w-36">
                Category
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider w-36 text-center font-bold">
                Fanout Queries
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider w-36 text-center font-bold">
                Top 10 Visibility
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider w-32 text-center font-bold">
                Avg Rank
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No query fanouts found. Ensure you have successful LLM Scraper runs containing fanout variations.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const expanded = !!expandedPrompts[item.promptId]
                const visibilityPercent = item.fanoutCount > 0 ? (item.top10Count / item.fanoutCount) * 100 : 0

                return (
                  <Fragment key={item.promptId}>
                    {/* Prompt Row */}
                    <TableRow
                      className="hover:bg-muted/15 cursor-pointer select-none align-middle"
                      onClick={() => toggleExpand(item.promptId)}
                    >
                      <TableCell className="p-3.5 text-center">
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-3.5 w-[380px] max-w-[380px] whitespace-normal break-words">
                        {item.promptText}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {item.category ? (
                          <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold tracking-wider">
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3.5 font-medium text-sm text-foreground/80">
                        {item.fanoutCount} queries
                      </TableCell>
                      <TableCell className="text-center py-3.5">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-foreground">
                            {visibilityPercent.toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.top10Count} of {item.fanoutCount} ranked
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3.5">
                        {item.avgRank !== null ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-400">
                            {item.avgRank.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Sub-table */}
                    {expanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                        <TableCell colSpan={6} className="p-0 border-t">
                          <div className="px-6 py-4 bg-muted/20 border-l-2 border-primary/40">
                            <div className="flex items-center gap-1.5 mb-3">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Fanout Query Variations & Rankings
                              </h4>
                            </div>
                            <Table className="bg-background/50 border rounded-lg overflow-hidden">
                              <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                  <TableHead className="font-semibold text-xs text-muted-foreground py-2">
                                    Fanout Query String
                                  </TableHead>
                                  <TableHead className="font-semibold text-xs text-muted-foreground w-36 text-center py-2">
                                    Top 10 Rank
                                  </TableHead>
                                  <TableHead className="font-semibold text-xs text-muted-foreground py-2">
                                    Ranked Page URL
                                  </TableHead>
                                  <TableHead className="font-semibold text-xs text-muted-foreground w-40 text-right py-2">
                                    Last Checked
                                  </TableHead>
                                  <TableHead className="font-semibold text-xs text-muted-foreground w-24 text-center py-2">
                                    Recheck
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.variations.map((v) => {
                                    const key = `${v.runId}::${v.query}`
                                    const recheck = recheckState[key]
                                    const displayRank = recheck ? recheck.rank : v.lastRank
                                    const displayUrl = recheck ? recheck.url : v.lastUrl
                                    const isLoading = recheck?.loading ?? false
                                    return (
                                  <TableRow key={v.query} className="hover:bg-background/80">
                                    <TableCell className="font-medium text-sm text-foreground/80 py-2.5">
                                      {v.query}
                                    </TableCell>
                                    <TableCell className="text-center py-2.5">
                                      {isLoading ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground mx-auto" />
                                      ) : displayRank !== null ? (
                                        <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-bold px-2 py-0.5 text-xs">
                                          Rank {displayRank}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-muted-foreground bg-muted border-none font-semibold px-2 py-0.5 text-xs">
                                          Not Ranked
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-2.5 max-w-xs truncate">
                                      {displayUrl ? (
                                        <a
                                          href={displayUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer truncate"
                                          title={displayUrl}
                                        >
                                          <LinkIcon className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{displayUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                          <ExternalLink className="w-2.5 h-2.5 opacity-65 shrink-0" />
                                        </a>
                                      ) : (
                                        <span className="text-xs text-muted-foreground/40">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground py-2.5">
                                      {new Date(v.lastChecked).toLocaleString(undefined, {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                      })}
                                    </TableCell>
                                    <TableCell className="text-center py-2.5">
                                      <button
                                        onClick={() => handleRecheck(v.query, v.runId, item.projectId)}
                                        disabled={isLoading}
                                        title="Re-check Google ranking now"
                                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                                      >
                                        <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} />
                                        {isLoading ? 'Checking…' : 'Recheck'}
                                      </button>
                                      {recheck?.error && (
                                        <p className="text-[9px] text-destructive mt-0.5 max-w-[80px] truncate" title={recheck.error}>
                                          {recheck.error}
                                        </p>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                    )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
