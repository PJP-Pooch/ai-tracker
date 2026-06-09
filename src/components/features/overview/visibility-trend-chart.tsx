'use client'

import { useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { VisibilityTrendPoint } from '@/lib/queries/overview'

interface VisibilityTrendChartProps {
  data: VisibilityTrendPoint[]
  brandName?: string
}

export function VisibilityTrendChart({ data, brandName }: VisibilityTrendChartProps) {
  const [showCompetitors, setShowCompetitors] = useState(false)
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility Score — 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No trend data yet.
        </CardContent>
      </Card>
    )
  }

  // Extract competitor keys dynamically (any key that is not 'date' or 'score')
  const competitorKeys = data.length > 0
    ? Object.keys(data[0]).filter((key) => key !== 'date' && key !== 'score')
    : []

  const competitorColorKeys = ['secondary', 'tertiary', 'quaternary', 'quinary'] as const

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Visibility Score — 30 Days</CardTitle>
        <label className="flex items-center gap-2 text-sm font-normal cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={showCompetitors}
            onChange={(e) => setShowCompetitors(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
          />
          <span>Show Competitors</span>
        </label>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visibility-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: colors.axis }}
              tickLine={false}
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
              }
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: colors.axis }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${colors.tooltip.border}`,
                fontSize: 12,
                background: colors.tooltip.bg,
                color: colors.tooltip.color,
              }}
              labelFormatter={(l) => typeof l === 'string' ? new Date(l).toLocaleDateString() : l}
            />
            {showCompetitors && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />}
            <Area
              type="monotone"
              dataKey="score"
              name={brandName || 'Own Brand'}
              stroke={colors.primary}
              strokeWidth={2}
              fill="url(#visibility-gradient)"
              dot={false}
            />
            {showCompetitors &&
              competitorKeys.map((key, index) => {
                const colorKey = competitorColorKeys[index % competitorColorKeys.length]
                const strokeColor = colors[colorKey]
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={false}
                  />
                )
              })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
