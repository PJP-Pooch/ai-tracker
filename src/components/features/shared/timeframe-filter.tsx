'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TimeframeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('dateRange') ?? 'all'

  const set = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === 'all') {
        params.delete('dateRange')
      } else {
        params.set('dateRange', value)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-1.5">
      <Select value={current} onValueChange={set}>
        <SelectTrigger className="w-40 bg-background h-8.5 text-xs sm:text-sm">
          <SelectValue placeholder="All Time">
            {(() => {
              if (current === 'today') return 'Today'
              if (current === 'yesterday') return 'Yesterday'
              if (current === '7days') return 'Last 7 Days'
              if (current === '30days') return 'Last 30 Days'
              return 'All Time'
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
