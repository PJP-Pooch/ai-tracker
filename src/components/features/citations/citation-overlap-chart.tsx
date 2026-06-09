'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { CitationOverlapEntry } from '@/lib/queries/citations'

interface CitationOverlapChartProps {
  data: CitationOverlapEntry[]
}

export function CitationOverlapChart({ data }: CitationOverlapChartProps) {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light

  if (data.length === 0) {
    return null
  }

  const chartData = data.slice(0, 10).map((d) => ({
    name: d.name,
    ChatGPT: d.chatgpt_count,
    Gemini: d.gemini_count,
    type: d.type,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Citation Share by Brand</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: colors.axis }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: colors.axis }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${colors.tooltip.border}`,
                fontSize: 12,
                background: colors.tooltip.bg,
                color: colors.tooltip.color,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ChatGPT" fill={colors.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gemini" fill={colors.secondary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
