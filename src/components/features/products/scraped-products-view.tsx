'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShoppingBag,
  Search,
  ExternalLink,
  Star,
  Bot,
  Sparkles,
  TrendingUp,
  Coins,
  Info,
  Calendar,
  Globe,
  Trophy,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Medal,
  Award,
} from 'lucide-react'
import type { ScrapedProductItem } from '@/lib/queries/products'

interface ScrapedProductsViewProps {
  initialProducts: ScrapedProductItem[]
  ownBrandName?: string
}

// ─── colour helpers ───────────────────────────────────────────────────────────
const BRAND_PALETTE = [
  { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400' },
  { bar: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400' },
  { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400' },
  { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400' },
  { bar: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:text-cyan-400' },
]
const OWN_BRAND_COLOR = { bar: 'bg-primary', text: 'text-primary', badge: 'bg-primary/10 text-primary border-primary/20' }

// ─── leaderboard helpers ──────────────────────────────────────────────────────
function computeLeaderboard(products: ScrapedProductItem[], key: 'brand' | 'domain', top = 5) {
  const counts: Record<string, number> = {}
  products.forEach(p => {
    const val = p[key] || 'Unknown'
    counts[val] = (counts[val] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, count]) => ({ name, count, share: products.length ? Math.round((count / products.length) * 100) : 0 }))
}

// ─── HorizontalBar component ─────────────────────────────────────────────────
function HorizontalBar({
  label,
  share,
  count,
  barClass,
  textClass,
  isOwn,
  rank,
}: {
  label: string
  share: number
  count: number
  barClass: string
  textClass: string
  isOwn?: boolean
  rank: number
}) {
  const rankIcons = [<Trophy key="t" className="w-3.5 h-3.5 text-amber-500" />, <Medal key="m" className="w-3.5 h-3.5 text-slate-400" />, <Award key="a" className="w-3.5 h-3.5 text-orange-400" />]
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="shrink-0 w-4 flex items-center justify-center">
            {rank < 3 ? rankIcons[rank] : <span className="text-[10px] font-bold text-muted-foreground">#{rank + 1}</span>}
          </span>
          <span className={cn('text-xs font-semibold truncate', textClass, isOwn && 'font-black')} title={label}>
            {label}
            {isOwn && <span className="ml-1 text-[9px] font-bold opacity-60">(You)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground">{count} recs</span>
          <span className={cn('text-[10px] font-black tabular-nums min-w-[30px] text-right', textClass)}>{share}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClass, isOwn && 'opacity-100')}
          style={{ width: `${Math.max(share, 2)}%` }}
        />
      </div>
    </div>
  )
}

// ─── GroupLeaderboard component ───────────────────────────────────────────────
function GroupLeaderboard({ products, ownBrandName }: { products: ScrapedProductItem[]; ownBrandName: string }) {
  const brandLb = computeLeaderboard(products, 'brand', 5)
  const merchantLb = computeLeaderboard(products, 'domain', 4)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-muted/20 border border-border/50">
      {/* Brand share */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-500" /> Brand Recommendations
        </p>
        <div className="space-y-2.5">
          {brandLb.map((item, i) => {
            const isOwn = item.name.toLowerCase() === ownBrandName.toLowerCase()
            const color = isOwn ? OWN_BRAND_COLOR : BRAND_PALETTE[i % BRAND_PALETTE.length]
            return (
              <HorizontalBar
                key={item.name}
                label={item.name}
                share={item.share}
                count={item.count}
                barClass={color.bar}
                textClass={color.text}
                isOwn={isOwn}
                rank={i}
              />
            )
          })}
        </div>
      </div>
      {/* Merchant share */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-cyan-500" /> Top Merchants
        </p>
        <div className="space-y-2.5">
          {merchantLb.map((item, i) => {
            const color = BRAND_PALETTE[i % BRAND_PALETTE.length]
            return (
              <HorizontalBar
                key={item.name}
                label={item.name}
                share={item.share}
                count={item.count}
                barClass={color.bar}
                textClass={color.text}
                rank={i}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ScrapedProductsView({ initialProducts, ownBrandName = 'Own Brand' }: ScrapedProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'prompt'>('prompt')
  const [deduplicate, setDeduplicate] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<string>('date_desc')
  // Track which groups are expanded (default: all collapsed)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Extract all unique merchant domains for filter dropdown
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>()
    initialProducts.forEach(p => {
      if (p.domain) domains.add(p.domain.toLowerCase())
    })
    return Array.from(domains).sort()
  }, [initialProducts])

  // Extract all unique brands for filter dropdown
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    initialProducts.forEach(p => {
      if (p.brand) brands.add(p.brand)
    })
    return Array.from(brands).sort()
  }, [initialProducts])

  // Filter and Sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      )
    }

    if (selectedPlatform !== 'all') {
      result = result.filter(p => p.platform === selectedPlatform)
    }

    if (selectedDomain !== 'all') {
      result = result.filter(p => p.domain.toLowerCase() === selectedDomain)
    }

    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand)
    }

    if (deduplicate) {
      const uniqueMap = new Map<string, ScrapedProductItem>()
      const sortedByNewest = [...result].sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime())
      for (const item of sortedByNewest) {
        const key = `${item.title.toLowerCase()}||${item.domain.toLowerCase()}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item)
        }
      }
      result = Array.from(uniqueMap.values())
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price
        case 'price_desc': return b.price - a.price
        case 'rating_desc': return (b.rating?.value ?? 0) - (a.rating?.value ?? 0)
        case 'date_desc':
        default:
          return new Date(b.runDate).getTime() - new Date(a.runDate).getTime()
      }
    })

    return result
  }, [initialProducts, searchQuery, selectedPlatform, selectedDomain, selectedBrand, deduplicate, sortBy])

  // KPI stats
  const stats = useMemo(() => {
    const total = filteredAndSortedProducts.length
    if (total === 0) return { total: 0, minPrice: 0, maxPrice: 0, avgPrice: 0, topMerchant: 'N/A' }

    const prices = filteredAndSortedProducts.map(p => p.price).filter(p => p > 0)
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

    const merchantCounts: Record<string, number> = {}
    filteredAndSortedProducts.forEach(p => {
      if (p.domain) merchantCounts[p.domain] = (merchantCounts[p.domain] || 0) + 1
    })

    let topMerchant = 'N/A'
    let maxCount = 0
    Object.entries(merchantCounts).forEach(([merchant, count]) => {
      if (count > maxCount) { maxCount = count; topMerchant = merchant }
    })

    return { total, minPrice, maxPrice, avgPrice, topMerchant }
  }, [filteredAndSortedProducts])

  // Overall leaderboard data
  const overallBrandLeaderboard = useMemo(() => computeLeaderboard(filteredAndSortedProducts, 'brand', 5), [filteredAndSortedProducts])
  const overallMerchantLeaderboard = useMemo(() => computeLeaderboard(filteredAndSortedProducts, 'domain', 5), [filteredAndSortedProducts])

  // Group products
  const groupedProducts = useMemo(() => {
    if (groupBy === 'none') return null
    const groups: Record<string, ScrapedProductItem[]> = {}
    filteredAndSortedProducts.forEach(p => {
      const key = groupBy === 'category' ? p.category : p.promptText
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return groups
  }, [filteredAndSortedProducts, groupBy])

  const groupKeys = groupedProducts ? Object.keys(groupedProducts) : []

  function toggleGroup(key: string) {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }
  function expandAll() {
    const next: Record<string, boolean> = {}
    groupKeys.forEach(k => { next[k] = true })
    setExpandedGroups(next)
  }
  function collapseAll() {
    setExpandedGroups({})
  }

  // ─── Product card ───────────────────────────────────────────────────────────
  const renderProductCard = (p: ScrapedProductItem) => {
    const formattedPrice = p.price > 0 ? new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: p.currency || 'GBP',
    }).format(p.price) : 'N/A'

    return (
      <Card key={p.id} className="flex flex-col bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border/100 transition-all group duration-200">
        {/* Image panel */}
        <div className="relative aspect-square w-full bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-center p-4 overflow-hidden border-b border-border/40 shrink-0">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={p.title}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>'
              }}
            />
          ) : (
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
          )}

          {/* Scraper Platform Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
            {p.platform === 'chatgpt_scraper' ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-semibold text-[9px] uppercase tracking-wider gap-1 border-none shadow-sm px-2 py-0.5">
                <Bot className="w-3 h-3" />
                ChatGPT
              </Badge>
            ) : (
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-semibold text-[9px] uppercase tracking-wider gap-1 border-none shadow-sm px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                Gemini
              </Badge>
            )}

            {p.tag && (
              <Badge variant="secondary" className="text-[8.5px] uppercase font-bold tracking-wide shadow-sm px-2 py-0.5 bg-indigo-500 text-white border-none">
                {p.tag}
              </Badge>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge variant="outline" className="text-[8.5px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 font-bold uppercase truncate shrink-0 max-w-[80px]" title={`Brand: ${p.brand}`}>
                  {p.brand}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate" title={`Merchant: ${p.domain}`}>{p.domain}</span>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0 select-none">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(p.runDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <a
              href={p.url || '#'}
              target={p.url ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-xs font-bold leading-snug text-foreground hover:text-primary transition-colors line-clamp-2 cursor-pointer block min-h-[36px]"
              title={p.title}
            >
              {p.title}
            </a>
          </div>

          <div className="space-y-3 pt-2.5 border-t border-border/40 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-foreground">{formattedPrice}</span>

              {p.rating != null && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                  <Star className="w-3 h-3 fill-amber-500 inline" />
                  {p.rating.value}
                  {p.rating.votes_count && (
                    <span className="text-muted-foreground text-[9px] font-normal ml-0.5">({p.rating.votes_count})</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-start gap-1 bg-muted/30 p-2 rounded-lg text-[10px] text-muted-foreground leading-normal border border-border/40">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="line-clamp-2" title={`Scraped via prompt: "${p.promptText}"`}>
                Scraped via: <span className="font-semibold text-foreground/80">"{p.promptText}"</span>
              </div>
            </div>

            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  "w-full text-[11px] h-8 font-semibold cursor-pointer border-border hover:bg-muted flex items-center justify-center gap-1"
                )}
              >
                Shop Merchant
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShoppingBag className="w-8 h-8 text-primary" />
          Scraped Products
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse and filter product recommendations scraped across all ChatGPT and Gemini scraper runs.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products Found</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scraped recommendations</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Price</CardTitle>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-foreground">
              {stats.avgPrice > 0 ? `£${stats.avgPrice.toFixed(2)}` : '--'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Range: £{stats.minPrice.toFixed(0)} – £{stats.maxPrice.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Merchant</CardTitle>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-foreground truncate max-w-full" title={stats.topMerchant}>
              {stats.topMerchant}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Most recommended store</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources Breakdown</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 flex gap-4 mt-0.5">
            <div>
              <div className="text-lg font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                <Bot className="w-4 h-4 shrink-0" />
                {filteredAndSortedProducts.filter(p => p.platform === 'chatgpt_scraper').length}
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">ChatGPT</p>
            </div>
            <div className="w-px h-8 bg-border/60" />
            <div>
              <div className="text-lg font-bold flex items-center gap-1 text-blue-600 dark:text-blue-500">
                <Sparkles className="w-4 h-4 shrink-0" />
                {filteredAndSortedProducts.filter(p => p.platform === 'gemini_scraper').length}
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Gemini</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Overall Shopping Performance Leaderboard ─────────────────────────── */}
      {filteredAndSortedProducts.length > 0 && (
        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-sm font-bold text-foreground">Overall Shopping Performance</CardTitle>
              <Badge variant="secondary" className="text-[9px] uppercase font-bold px-2 py-0 ml-1">
                {filteredAndSortedProducts.length} products
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Which brands and merchants are being recommended most by AI scrapers across all prompts.
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Brand leaderboard */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-amber-500" /> Top Brands by Recommendations
                </p>
                <div className="space-y-3">
                  {overallBrandLeaderboard.map((item, i) => {
                    const isOwn = item.name.toLowerCase() === ownBrandName.toLowerCase()
                    const color = isOwn ? OWN_BRAND_COLOR : BRAND_PALETTE[i % BRAND_PALETTE.length]
                    return (
                      <HorizontalBar
                        key={item.name}
                        label={item.name}
                        share={item.share}
                        count={item.count}
                        barClass={color.bar}
                        textClass={color.text}
                        isOwn={isOwn}
                        rank={i}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Merchant leaderboard */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-cyan-500" /> Top Merchants by Recommendations
                </p>
                <div className="space-y-3">
                  {overallMerchantLeaderboard.map((item, i) => {
                    const color = BRAND_PALETTE[i % BRAND_PALETTE.length]
                    return (
                      <HorizontalBar
                        key={item.name}
                        label={item.name}
                        share={item.share}
                        count={item.count}
                        barClass={color.bar}
                        textClass={color.text}
                        rank={i}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control filters bar */}
      <Card className="border border-border/80 shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9"
                  placeholder="Search title, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Brand</label>
              <Select value={selectedBrand} onValueChange={(val) => setSelectedBrand(val || 'all')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {uniqueBrands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Merchant / Domain</label>
              <Select value={selectedDomain} onValueChange={(val) => setSelectedDomain(val || 'all')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Merchants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Merchants</SelectItem>
                  {uniqueDomains.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">AI Platform</label>
              <Select value={selectedPlatform} onValueChange={(val) => setSelectedPlatform(val || 'all')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="chatgpt_scraper">ChatGPT Scraper</SelectItem>
                  <SelectItem value="gemini_scraper">Gemini Scraper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Group By</label>
              <Select value={groupBy} onValueChange={(val) => {
                setGroupBy((val as 'none' | 'category' | 'prompt') || 'none')
                setExpandedGroups({})
              }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No Grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="category">Group by Category</SelectItem>
                  <SelectItem value="prompt">Group by Prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'date_desc')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Scan Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Latest Scans</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating_desc">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deduplicate Toggle + Count + Expand/Collapse controls */}
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                Deduplicate Recommendations (Latest Only)
              </label>
            </div>

            <div className="flex items-center gap-3">
              {groupBy !== 'none' && groupKeys.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
                    onClick={expandAll}
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
                    onClick={collapseAll}
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                    Collapse All
                  </Button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground font-medium">
                Showing {filteredAndSortedProducts.length} of {initialProducts.length} products
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products list grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="border-2 border-dashed border-border/80 p-16 text-center rounded-2xl bg-card/10">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Products Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or make sure your prompts have successfully run under Scraper platforms.
          </p>
        </div>
      ) : groupBy === 'none' || !groupedProducts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((p) => renderProductCard(p))}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {Object.entries(groupedProducts).map(([groupKey, productsInGroup]) => {
            const isExpanded = !!expandedGroups[groupKey]

            // Inline summary KPIs for collapsed header
            const topBrand = computeLeaderboard(productsInGroup, 'brand', 1)[0]
            const topMerchant = computeLeaderboard(productsInGroup, 'domain', 1)[0]
            const ownInGroup = productsInGroup.filter(p => p.brand.toLowerCase() === ownBrandName.toLowerCase()).length
            const ownPct = productsInGroup.length ? Math.round((ownInGroup / productsInGroup.length) * 100) : 0

            return (
              <Card key={groupKey} className="border border-border/80 shadow-sm bg-card/40 overflow-hidden">
                {/* ── Clickable group header ────────────────────────────────── */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Chevron */}
                    <span className="shrink-0 text-muted-foreground/60">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </span>

                    {/* Label pill */}
                    {groupBy === 'category' ? (
                      <span className="text-muted-foreground font-semibold text-[10px] uppercase bg-muted px-2.5 py-0.5 rounded-md border border-border/50 shrink-0">Category</span>
                    ) : (
                      <span className="text-primary font-semibold text-[10px] uppercase bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/25 shrink-0">Prompt</span>
                    )}

                    <h2 className="text-sm font-bold tracking-tight text-foreground truncate" title={groupKey}>
                      {groupKey}
                    </h2>

                    <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0 rounded-full bg-card border border-border/60 text-muted-foreground shrink-0">
                      {productsInGroup.length} {productsInGroup.length === 1 ? 'product' : 'products'}
                    </Badge>
                  </div>

                  {/* Inline summary KPIs (visible when collapsed) */}
                  {!isExpanded && (
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {topBrand && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-muted-foreground">Top Brand:</span>
                          <span className={cn(
                            'font-bold',
                            topBrand.name.toLowerCase() === ownBrandName.toLowerCase() ? 'text-primary' : 'text-foreground'
                          )}>
                            {topBrand.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">({topBrand.share}%)</span>
                        </div>
                      )}
                      {topMerchant && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span className="text-muted-foreground">Top Store:</span>
                          <span className="font-bold text-foreground">{topMerchant.name}</span>
                        </div>
                      )}
                      {ownBrandName !== 'Own Brand' && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-muted-foreground">Your share:</span>
                          <span className={cn('font-bold', ownPct > 0 ? 'text-primary' : 'text-muted-foreground')}>
                            {ownPct}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* ── Expandable content ───────────────────────────────────── */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-border/40">
                    {/* Group leaderboard micro-dashboard */}
                    <div className="mt-4">
                      <GroupLeaderboard products={productsInGroup} ownBrandName={ownBrandName} />
                    </div>

                    {/* Product grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {productsInGroup.map((p) => renderProductCard(p))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
