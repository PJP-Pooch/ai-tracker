import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiVariant = 'default' | 'gradient-indigo' | 'gradient-purple' | 'gradient-emerald' | 'gradient-amber'

interface KpiCardProps {
  label: string
  value: string | number
  delta?: number | null
  deltaLabel?: string
  suffix?: string
  description?: string
  variant?: KpiVariant
  icon?: React.ComponentType<{ className?: string }>
}

const gradientClass: Record<KpiVariant, string> = {
  'default':          '',
  'gradient-indigo':  'gradient-indigo shadow-lg shadow-indigo-500/20',
  'gradient-purple':  'gradient-purple shadow-lg shadow-purple-500/20',
  'gradient-emerald': 'gradient-emerald shadow-lg shadow-emerald-500/20',
  'gradient-amber':   'gradient-amber shadow-lg shadow-amber-500/20',
}

export function KpiCard({
  label, value, delta, deltaLabel, suffix, description,
  variant = 'default', icon: Icon,
}: KpiCardProps) {
  const isGradient = variant !== 'default'
  const hasDelta = delta !== null && delta !== undefined
  const DeltaIcon = hasDelta
    ? delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
    : null

  const deltaColor = isGradient
    ? 'text-white/90 bg-white/20'
    : hasDelta
      ? delta > 0
        ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/20'
        : delta < 0
          ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-500/20'
          : 'text-muted-foreground bg-muted'
      : ''

  return (
    <div className={cn(
      'rounded-xl p-5',
      isGradient
        ? `${gradientClass[variant]} border-0`
        : 'bg-card border border-border',
    )}>
      {Icon && (
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
          isGradient ? 'bg-white/20' : 'bg-primary/10',
        )}>
          <Icon className={cn('w-5 h-5', isGradient ? 'text-white' : 'text-primary')} />
        </div>
      )}
      <p className={cn(
        'text-xs font-medium uppercase tracking-wide mb-1',
        isGradient ? 'text-white/70' : 'text-muted-foreground',
      )}>
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className={cn(
          'text-3xl font-bold leading-none',
          isGradient ? 'text-white' : 'text-foreground',
        )}>
          {value}
          {suffix && (
            <span className={cn(
              'text-lg font-normal ml-0.5',
              isGradient ? 'text-white/70' : 'text-muted-foreground/70',
            )}>
              {suffix}
            </span>
          )}
        </span>
        {hasDelta && DeltaIcon && (
          <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${deltaColor}`}>
            <DeltaIcon className="w-3 h-3" />
            {delta > 0 ? '+' : ''}{delta}
            {deltaLabel && <span className="font-normal">{deltaLabel}</span>}
          </span>
        )}
      </div>
      {description && (
        <p className={cn(
          'text-xs mt-1.5',
          isGradient ? 'text-white/60' : 'text-muted-foreground/70',
        )}>
          {description}
        </p>
      )}
    </div>
  )
}
