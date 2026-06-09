'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
            <SelectValue placeholder="Platform" />
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
            <SelectValue placeholder="Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="informational">Informational</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
