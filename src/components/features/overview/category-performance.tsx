'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MetricInfo } from '@/components/ui/metric-info'
import { CHART_COLORS } from '@/lib/chart-colors'
import { BarChart3, Table as TableIcon } from 'lucide-react'
import type { CategoryPerformanceRow } from '@/lib/queries/overview'

interface CategoryPerformanceProps {
  data: CategoryPerformanceRow[]
  ownBrandName: string
}

export function CategoryPerformance({ data, ownBrandName }: CategoryPerformanceProps) {
  const [activeTab, setActiveTab] = useState('chart')
  const { resolvedTheme } = useTheme()
  const colors = resolvedTheme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light

  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Category Performance vs Competitors</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No category performance data yet.
        </CardContent>
      </Card>
    )
  }

  // Extract competitor names dynamically
  const competitorNames = data[0]?.competitors.map((c) => c.name) ?? []

  // Transform data for Recharts BarChart
  const chartData = data.map((item) => {
    const row: Record<string, string | number> = {
      category: item.category,
      [ownBrandName]: item.ownScore,
    }
    item.competitors.forEach((c) => {
      row[c.name] = c.score
    })
    return row
  })

  const competitorColorKeys = ['secondary', 'tertiary', 'quaternary', 'quinary'] as const

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-foreground">Category Performance vs Competitors</CardTitle>
            <MetricInfo>
              <p><strong>What this shows:</strong> The AI search visibility score (mention rate) for your brand compared directly with competitors, broken down by prompt categories.</p>
              <p><strong>Usefulness:</strong> Identify which categories your brand dominates and where competitors are winning. Use filters above to toggle branded vs. non-branded queries.</p>
            </MetricInfo>
          </div>
          <p className="text-xs text-muted-foreground">
            Compare brand visibility percentages across different prompt categories.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="h-9">
            <TabsTrigger value="chart" className="px-3">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="table" className="px-3">
              <TableIcon className="h-4 w-4 mr-1.5" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="chart" className="outline-none mt-0">
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: colors.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: colors.axis }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${colors.tooltip.border}`,
                      fontSize: 12,
                      background: colors.tooltip.bg,
                      color: colors.tooltip.color,
                    }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  
                  {/* Primary Brand Bar */}
                  <Bar
                    dataKey={ownBrandName}
                    fill={colors.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />

                  {/* Competitor Bars */}
                  {competitorNames.map((name, index) => {
                    const colorKey = competitorColorKeys[index % competitorColorKeys.length]
                    const barColor = colors[colorKey]
                    return (
                      <Bar
                        key={name}
                        dataKey={name}
                        fill={barColor}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table" className="outline-none mt-0">
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold text-foreground">Category</TableHead>
                    <TableHead className="text-center font-semibold text-foreground w-[120px]">Prompts</TableHead>
                    <TableHead className="text-right font-semibold text-primary">{ownBrandName}</TableHead>
                    {competitorNames.map((name) => (
                      <TableHead key={name} className="text-right font-semibold text-foreground">
                        {name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.category} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-normal">
                          {row.promptCount} prompt{row.promptCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {row.ownScore}%
                      </TableCell>
                      {row.competitors.map((comp) => (
                        <TableCell key={comp.name} className="text-right font-medium text-foreground">
                          {comp.score}%
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
