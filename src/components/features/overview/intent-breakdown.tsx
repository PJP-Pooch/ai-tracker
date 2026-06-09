'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IntentVisibility } from '@/lib/queries/overview'
import { cn } from '@/lib/utils'

interface IntentBreakdownProps {
  data: IntentVisibility[]
}

const intentLabels: Record<string, { title: string; subtitle: string; color: string; bg: string; fill: string }> = {
  informational: {
    title: 'Informational',
    subtitle: 'Problem & Niche Awareness',
    color: 'text-sky-600',
    bg: 'bg-sky-500/10',
    fill: 'bg-sky-500',
  },
  commercial: {
    title: 'Commercial',
    subtitle: 'Competitor Consideration',
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    fill: 'bg-purple-500',
  },
  transactional: {
    title: 'Transactional',
    subtitle: 'Purchase & Brand Selection',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    fill: 'bg-emerald-500',
  },
}

export function IntentBreakdown({ data }: IntentBreakdownProps) {
  // Sort by funnel order: informational, then commercial, then transactional
  const funnelOrder = ['informational', 'commercial', 'transactional']
  const sortedData = [...data].sort(
    (a, b) => funnelOrder.indexOf(a.intent) - funnelOrder.indexOf(b.intent)
  )

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground">AI Visibility by Funnel Stage</CardTitle>
        <p className="text-xs text-muted-foreground">
          Brand mention frequency in AI search responses grouped by customer journey stages.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {sortedData.map((item) => {
          const cfg = intentLabels[item.intent] ?? {
            title: item.intent,
            subtitle: 'Search Intent',
            color: 'text-indigo-600',
            bg: 'bg-indigo-500/10',
            fill: 'bg-indigo-500',
          }

          return (
            <div key={item.intent} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold capitalize', cfg.color)}>
                      {cfg.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full border bg-muted font-medium text-muted-foreground shrink-0">
                      {item.promptCount} prompt{item.promptCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{cfg.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-foreground">
                    {item.visibilityScore}%
                  </span>
                  <span className="text-[10px] block text-muted-foreground leading-none">visibility</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', cfg.fill)}
                  style={{ width: `${item.visibilityScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
