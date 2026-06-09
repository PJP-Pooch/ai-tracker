'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CitationOverlapEntry } from '@/lib/queries/citations'

interface CitationOverlapChartProps {
  data: CitationOverlapEntry[]
}

export function CitationOverlapChart({ data }: CitationOverlapChartProps) {
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ChatGPT" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gemini" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
