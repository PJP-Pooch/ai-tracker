'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'all', label: 'All Queries' },
  { value: 'non_branded', label: 'Non-Branded' },
  { value: 'branded', label: 'Branded' },
] as const

export function QueryTypeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('queryType') ?? 'all'

  const set = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete('queryType')
      } else {
        params.set('queryType', value)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-1 bg-muted/60 border rounded-lg p-1">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => set(value)}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap',
            current === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
