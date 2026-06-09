import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface PositionCellProps {
  position: number | null
  mentioned: boolean
  mentionType?: 'top_choice' | 'recommended' | 'mentioned_only' | null
}

export function PositionCell({ position, mentioned, mentionType }: PositionCellProps) {
  if (!mentioned) {
    return <span className="text-muted-foreground/40 text-sm">—</span>
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
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border shrink-0',
          colorClass
        )}
      >
        {position}
      </span>
      {mentionType && (
        <span className={cn(
          'text-[9px] px-1 py-0.5 rounded font-semibold border shrink-0 uppercase tracking-wider',
          mentionType === 'top_choice'
            ? 'bg-amber-100/60 text-amber-700 border-amber-200 flex items-center gap-0.5'
            : mentionType === 'recommended'
              ? 'bg-purple-100/60 text-purple-700 border-purple-200'
              : 'bg-neutral-100/60 text-neutral-500 border-neutral-200'
        )}>
          {mentionType === 'top_choice' && <Star className="w-2.5 h-2.5 fill-amber-500 stroke-amber-600" />}
          {mentionType === 'top_choice' ? 'Top Choice' : mentionType === 'recommended' ? 'Recomm.' : 'Mention'}
        </span>
      )}
    </div>
  )
}
