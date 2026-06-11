'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from './tooltip'

interface MetricInfoProps {
  children: React.ReactNode
  light?: boolean
  className?: string
}

export function MetricInfo({ children, light, className }: MetricInfoProps) {
  return (
    <TooltipProvider delay={200}>
      <TooltipRoot>
        <TooltipTrigger
          className={cn(
            'inline-flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
        >
          <Info
            className={cn('h-3.5 w-3.5', light ? 'text-white' : 'text-muted-foreground')}
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1.5 leading-relaxed">{children}</div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}
