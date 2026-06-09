import { cn } from '@/lib/utils'

interface PositionCellProps {
  position: number | null
  mentioned: boolean
}

export function PositionCell({ position, mentioned }: PositionCellProps) {
  if (!mentioned) {
    return <span className="text-neutral-300 text-sm">—</span>
  }

  const colorClass =
    position === 1
      ? 'text-green-700 bg-green-50 border-green-200'
      : position === 2
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : position === 3
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : position != null && position <= 5
            ? 'text-orange-700 bg-orange-50 border-orange-200'
            : 'text-red-700 bg-red-50 border-red-200'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border',
        colorClass
      )}
    >
      {position}
    </span>
  )
}
