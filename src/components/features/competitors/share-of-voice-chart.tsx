'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

interface ShareOfVoiceChartProps {
  data: Array<{ name: string; share: number; isOwn: boolean }>
}

export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share of AI Voice</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-neutral-400 text-sm">
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
                  fill={COLORS[index % COLORS.length]}
                  opacity={entry.isOwn ? 1 : 0.7}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v}%`, 'Share']}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value, entry) => {
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
