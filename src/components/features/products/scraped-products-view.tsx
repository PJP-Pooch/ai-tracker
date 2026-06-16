'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Globe
} from 'lucide-react'
import type { ScrapedProductItem } from '@/lib/queries/products'

interface ScrapedProductsViewProps {
  initialProducts: ScrapedProductItem[]
}

export function ScrapedProductsView({ initialProducts }: ScrapedProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')

  // Extract all unique merchant domains for filter dropdown
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>()
    initialProducts.forEach(p => {
      if (p.domain) domains.add(p.domain.toLowerCase())
    })
    return Array.from(domains).sort()
  }, [initialProducts])

  // Filter and Sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.domain.toLowerCase().includes(q)
      )
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      result = result.filter(p => p.platform === selectedPlatform)
    }

    // Domain filter
    if (selectedDomain !== 'all') {
      result = result.filter(p => p.domain.toLowerCase() === selectedDomain)
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'rating_desc':
          return (b.rating?.value ?? 0) - (a.rating?.value ?? 0)
        case 'date_desc':
        default:
          return new Date(b.runDate).getTime() - new Date(a.runDate).getTime()
      }
    })

    return result
  }, [initialProducts, searchQuery, selectedPlatform, selectedDomain, sortBy])

  // Compute stats based on the filtered list
  const stats = useMemo(() => {
    const total = filteredAndSortedProducts.length
    if (total === 0) {
      return { total: 0, minPrice: 0, maxPrice: 0, avgPrice: 0, topMerchant: 'N/A' }
    }

    const prices = filteredAndSortedProducts.map(p => p.price).filter(p => p > 0)
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

    // Find top merchant domain
    const merchantCounts: Record<string, number> = {}
    filteredAndSortedProducts.forEach(p => {
      if (p.domain) {
        merchantCounts[p.domain] = (merchantCounts[p.domain] || 0) + 1
      }
    })
    
    let topMerchant = 'N/A'
    let maxCount = 0
    Object.entries(merchantCounts).forEach(([merchant, count]) => {
      if (count > maxCount) {
        maxCount = count
        topMerchant = merchant
      }
    })

    return { total, minPrice, maxPrice, avgPrice, topMerchant }
  }, [filteredAndSortedProducts])

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShoppingBag className="w-8 h-8 text-primary" />
          Scraped Products
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse and filter product listings recommended across all ChatGPT and Gemini scraper runs.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
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

        {/* Avg Price */}
        <Card className="border border-border/80 shadow-sm bg-card/40">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Price</CardTitle>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-foreground">
              {stats.avgPrice > 0 ? `$${stats.avgPrice.toFixed(2)}` : '--'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Range: ${stats.minPrice.toFixed(0)} - ${stats.maxPrice.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        {/* Top Merchant */}
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

        {/* Platform breakdown */}
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

      {/* Control filters bar */}
      <Card className="border border-border/80 shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9"
                  placeholder="Search title or merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((p) => {
            const formattedPrice = p.price > 0 ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: p.currency || 'USD',
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

                    {/* Promo tag */}
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
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate max-w-[150px]">{p.domain}</span>
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

                    {/* Source Prompt Popover Indicator */}
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
          })}
        </div>
      )}
    </div>
  )
}
