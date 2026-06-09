'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ShareOfVoiceGaugeProps {
  value: number
}

export function ShareOfVoiceGauge({ value }: ShareOfVoiceGaugeProps) {
  const data = [{ value, fill: '#6366f1' }]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share of AI Voice</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              data={data}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                background={{ fill: '#f3f4f6' }}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-bold text-neutral-900">{value}</span>
            <span className="text-sm text-neutral-400">%</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400 mt-2 text-center">
          Your brand&apos;s share of total AI mentions today
        </p>
      </CardContent>
    </Card>
  )
}
