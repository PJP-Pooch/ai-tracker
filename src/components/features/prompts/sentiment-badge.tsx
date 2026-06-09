import { cn } from '@/lib/utils'

type Sentiment = 'positive' | 'neutral' | 'negative' | null

const styles: Record<string, string> = {
  positive: 'bg-green-50 text-green-700 border-green-200',
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
}

const labels: Record<string, string> = {
  positive: '▲ Positive',
  neutral: '● Neutral',
  negative: '▼ Negative',
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  if (!sentiment) return <span className="text-neutral-300 text-sm">—</span>

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
