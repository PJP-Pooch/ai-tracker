'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { CompetitorScore } from '@/lib/queries/competitors'

interface VisibilityTrendChartProps {
  competitors: CompetitorScore[]
}

export function VisibilityTrendChart({ competitors: brands }: VisibilityTrendChartProps) {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light
  const palette = [colors.primary, colors.quaternary, colors.tertiary, colors.secondary, colors.quinary]

  const allDates = [...new Set(brands.flatMap((b) => b.trendData.map((d) => d.date)))].sort()

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date }
    for (const brand of brands) {
      const found = brand.trendData.find((d) => d.date === date)
      point[brand.brandName] = found?.score ?? 0
    }
    return point
  })

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No trend data yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Visibility Score — 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {brands.map((brand, i) => (
              <Line
                key={brand.brandId}
                type="monotone"
                dataKey={brand.brandName}
                stroke={palette[i % palette.length]}
                strokeWidth={brand.isOwn ? 2.5 : 1.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
