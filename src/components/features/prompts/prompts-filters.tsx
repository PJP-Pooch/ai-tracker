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
    <div className="flex gap-3 mb-4">
      <Input
        placeholder="Search prompts…"
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={searchParams.get('platform') ?? 'all'}
        onValueChange={(v) => { if (v) updateFilter('platform', v) }}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="chatgpt">ChatGPT</SelectItem>
          <SelectItem value="gemini">Gemini</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get('priority') ?? 'all'}
        onValueChange={(v) => { if (v) updateFilter('priority', v) }}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
