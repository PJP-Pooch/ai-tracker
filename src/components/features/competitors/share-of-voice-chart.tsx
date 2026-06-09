'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'

interface ShareOfVoiceChartProps {
  data: Array<{ name: string; share: number; isOwn: boolean }>
}

export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light
  const palette = [colors.primary, colors.quaternary, colors.tertiary, colors.secondary, colors.quinary]

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share of AI Voice</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          No data yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share of AI Voice</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="share"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={palette[index % palette.length]}
                  opacity={entry.isOwn ? 1 : 0.7}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v}%`, 'Share']}
              contentStyle={{
                borderRadius: 8,
                fontSize: 12,
                background: colors.tooltip.bg,
                border: `1px solid ${colors.tooltip.border}`,
                color: colors.tooltip.color,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const item = data.find((d) => d.name === value)
                return `${value} (${item?.share ?? 0}%)`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
