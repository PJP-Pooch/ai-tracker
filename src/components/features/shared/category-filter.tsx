'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CategoryFilterProps {
  categories: string[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  const set = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === 'all') {
        params.delete('category')
      } else {
        params.set('category', value)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-1.5">
      <Select value={current} onValueChange={set}>
        <SelectTrigger className="w-44 bg-background h-8.5">
          <SelectValue placeholder="All Categories">
            {(() => {
              if (current === 'all') return 'All Categories'
              if (current === 'uncategorized') return 'Uncategorized'
              return current
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="uncategorized">Uncategorized</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
