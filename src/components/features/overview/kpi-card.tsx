import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  delta?: number | null
  deltaLabel?: string
  suffix?: string
  description?: string
}

export function KpiCard({ label, value, delta, deltaLabel, suffix, description }: KpiCardProps) {
  const hasDelta = delta !== null && delta !== undefined
  const DeltaIcon = hasDelta
    ? delta > 0
      ? TrendingUp
      : delta < 0
        ? TrendingDown
        : Minus
    : null

  const deltaColor = hasDelta
    ? delta > 0
      ? 'text-green-600 bg-green-50'
      : delta < 0
        ? 'text-red-500 bg-red-50'
        : 'text-neutral-400 bg-neutral-100'
    : ''

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-neutral-900 leading-none">
            {value}
            {suffix && <span className="text-lg font-normal text-neutral-400 ml-0.5">{suffix}</span>}
          </span>
          {hasDelta && DeltaIcon && (
            <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${deltaColor}`}>
              <DeltaIcon className="w-3 h-3" />
              {delta > 0 ? '+' : ''}{delta}
              {deltaLabel && <span className="font-normal">{deltaLabel}</span>}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-neutral-400 mt-1.5">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
