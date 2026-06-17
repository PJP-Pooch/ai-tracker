'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PromptsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const showCritiques = searchParams.get('showCritiques') === 'true'
  const toggleCritiques = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (showCritiques) {
      params.delete('showCritiques')
    } else {
      params.set('showCritiques', 'true')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
      <div className="flex-1 max-w-xs space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Search Prompts
        </label>
        <Input
          placeholder="Search prompts…"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full bg-background"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Filter by Platform
        </label>
        <Select
          value={searchParams.get('platform') ?? 'all'}
          onValueChange={(v) => { if (v) updateFilter('platform', v) }}
        >
          <SelectTrigger className="w-44 bg-background">
            <SelectValue placeholder="Platform">
              {(() => {
                const val = searchParams.get('platform') ?? 'all'
                if (val === 'chatgpt') return 'ChatGPT'
                if (val === 'gemini') return 'Gemini'
                return 'All Platforms'
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="chatgpt">ChatGPT</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Filter by Intent
        </label>
        <Select
          value={searchParams.get('intent') ?? 'all'}
          onValueChange={(v) => { if (v) updateFilter('intent', v) }}
        >
          <SelectTrigger className="w-44 bg-background">
            <SelectValue placeholder="Intent">
              {(() => {
                const val = searchParams.get('intent') ?? 'all'
                if (val === 'informational') return 'Informational'
                if (val === 'commercial') return 'Commercial'
                if (val === 'transactional') return 'Transactional'
                return 'All Intents'
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="informational">Informational</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Query Type
        </label>
        <Select
          value={searchParams.get('queryType') ?? 'all'}
          onValueChange={(v) => { if (v) updateFilter('queryType', v) }}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Query Type">
              {(() => {
                const val = searchParams.get('queryType') ?? 'all'
                if (val === 'branded') return 'Branded'
                if (val === 'non_branded') return 'Non-Branded'
                return 'All'
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="non_branded">Non-Branded</SelectItem>
            <SelectItem value="branded">Branded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Group By
        </label>
        <Select
          value={searchParams.get('groupBy') ?? 'category'}
          onValueChange={(v) => { if (v) updateFilter('groupBy', v) }}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Group By">
              {(() => {
                const val = searchParams.get('groupBy') ?? 'category'
                if (val === 'none') return 'None (List)'
                return 'Category'
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="none">None (List)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Critiques
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCritiques}
          className={cn(
            'h-10 gap-1.5 text-xs font-semibold',
            showCritiques && 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showCritiques ? 'Hiding Critiques' : 'Show Critiques'}
        </Button>
      </div>
    </div>
  )
}
