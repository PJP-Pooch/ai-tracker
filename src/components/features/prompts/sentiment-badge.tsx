import { cn } from '@/lib/utils'

type Sentiment = 'positive' | 'neutral' | 'negative' | null

const styles: Record<string, string> = {
  positive: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50',
  neutral: 'bg-muted text-muted-foreground border-border',
  negative: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
}

const labels: Record<string, string> = {
  positive: '▲ Positive',
  neutral: '● Neutral',
  negative: '▼ Negative',
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  if (!sentiment) return <span className="text-muted-foreground/40 text-sm">—</span>

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        styles[sentiment]
      )}
    >
      {labels[sentiment]}
    </span>
  )
}
