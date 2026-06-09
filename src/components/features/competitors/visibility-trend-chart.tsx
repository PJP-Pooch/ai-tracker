'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CompetitorScore } from '@/lib/queries/competitors'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

interface VisibilityTrendChartProps {
  competitors: CompetitorScore[]
}

export function VisibilityTrendChart({ competitors: brands }: VisibilityTrendChartProps) {
  // Pivot: [{ date, BrandA: score, BrandB: score }]
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
        <CardContent className="flex items-center justify-center py-12 text-neutral-400 text-sm">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
              }
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              labelFormatter={(l) => typeof l === 'string' ? new Date(l).toLocaleDateString() : l}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {brands.map((brand, i) => (
              <Line
                key={brand.brandId}
                type="monotone"
                dataKey={brand.brandName}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={brand.isOwn ? 2.5 : 1.5}
                dot={false}
                strokeDasharray={brand.isOwn ? undefined : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
