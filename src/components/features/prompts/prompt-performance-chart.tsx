'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { RunHistory } from '@/lib/queries/prompts'

interface PromptPerformanceChartProps {
  runs: RunHistory[]
  brandId: string | null
}

export function PromptPerformanceChart({ runs, brandId }: PromptPerformanceChartProps) {
  const [metric, setMetric] = useState<'rank' | 'citations'>('rank')
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light

  // Extract unique run dates (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(runs.map((r) => r.run_date.split('T')[0]))
  ).sort((a, b) => a.localeCompare(b)) // Ascending for time axis

  if (uniqueDates.length === 0) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Performance Trends — 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No historical scans for this prompt yet.
        </CardContent>
      </Card>
    )
  }

  const chartData = uniqueDates.map((date) => {
    const chatgptRun = runs.find((r) => r.platform === 'chatgpt' && r.run_date.startsWith(date))
    const geminiRun = runs.find((r) => r.platform === 'gemini' && r.run_date.startsWith(date))

    const getBrandPos = (run?: RunHistory) => {
      if (!run) return null
      const mention = run.mentions.find((m) => m.brand_id === brandId && m.mentioned)
      return mention ? mention.position : null
    }

    return {
      date,
      chatgptRank: getBrandPos(chatgptRun),
      geminiRank: getBrandPos(geminiRun),
      chatgptCitations: chatgptRun ? chatgptRun.citations.length : 0,
      geminiCitations: geminiRun ? geminiRun.citations.length : 0,
    }
  })

  // Theme-aware series colors
  const chatgptColor = '#10b981' // ChatGPT Green
  const geminiColor = '#3b82f6'  // Gemini Blue

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div
        className="rounded-xl p-3 shadow-lg border border-border/80 text-xs leading-relaxed"
        style={{
          background: colors.tooltip.bg,
          color: colors.tooltip.color,
        }}
      >
        <p className="font-semibold mb-1.5 text-foreground">
          {new Date(label).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        <div className="space-y-1">
          {payload.map((p: any) => {
            const isRank = metric === 'rank'
            let valStr = ''
            if (isRank) {
              valStr = p.value === null || p.value === undefined ? 'Not Mentioned' : `#${p.value}`
            } else {
              valStr = `${p.value} source${p.value !== 1 ? 's' : ''}`
            }

            return (
              <div key={p.name} className="flex items-center gap-4 justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.stroke || p.fill }}
                  />
                  {p.name}
                </span>
                <span className="font-bold text-foreground">{valStr}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Performance Trends</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">30-day history for this prompt</p>
        </div>

        <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/60">
          <button
            onClick={() => setMetric('rank')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              metric === 'rank'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            AI Rank
          </button>
          <button
            onClick={() => setMetric('citations')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              metric === 'citations'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Citations
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'rank' ? (
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: colors.axis }}
                  tickLine={false}
                  tickFormatter={(d: string) =>
                    new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis
                  reversed
                  domain={[1, 10]}
                  tick={{ fontSize: 10, fill: colors.axis }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="chatgptRank"
                  name="ChatGPT Position"
                  stroke={chatgptColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="geminiRank"
                  name="Gemini Position"
                  stroke={geminiColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: colors.axis }}
                  tickLine={false}
                  tickFormatter={(d: string) =>
                    new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.axis }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar
                  dataKey="chatgptCitations"
                  name="ChatGPT Citations"
                  fill={chatgptColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="geminiCitations"
                  name="Gemini Citations"
                  fill={geminiColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
