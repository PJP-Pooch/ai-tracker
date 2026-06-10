'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from 'next-themes'
import type { CompetitorScore } from '@/lib/queries/competitors'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { CHART_COLORS } from '@/lib/chart-colors'

interface CompetitorCardProps {
  competitor: CompetitorScore
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light
  const { delta } = competitor

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const deltaColor =
    delta > 0
      ? 'text-green-500'
      : delta < 0
        ? 'text-red-500'
        : 'text-muted-foreground'

  const lineColor = competitor.isOwn ? colors.primary : colors.axis

  return (
    <Card className={competitor.isOwn ? 'border-primary/30 ring-1 ring-primary/20' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="truncate">{competitor.brandName}</span>
          {competitor.isOwn && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Your Brand
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{competitor.domain}</p>
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-foreground">
            {competitor.currentScore}
          </span>
          <div className={`flex items-center gap-1 text-sm font-medium ${deltaColor}`}>
            <DeltaIcon className="w-4 h-4" />
            {delta > 0 ? '+' : ''}{delta}
            <span className="text-xs font-normal text-muted-foreground/70">vs 7d</span>
          </div>
        </div>

        {competitor.trendData.length > 1 && (
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={competitor.trendData}>
              <defs>
                <linearGradient id={`grad-${competitor.brandId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="score"
                stroke={lineColor}
                strokeWidth={1.5}
                fill={`url(#grad-${competitor.brandId})`}
                dot={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  color: colors.tooltip.color,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{competitor.mentionCount} mentions</span>
          <span>{competitor.citationCount} citations</span>
        </div>
      </CardContent>
    </Card>
  )
}
