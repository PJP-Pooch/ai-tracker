import { KpiCard } from './kpi-card'
import type { ExecutiveKPIs } from '@/lib/queries/overview'

interface KpiGridProps {
  kpis: ExecutiveKPIs
}

export function KpiGrid({ kpis }: KpiGridProps) {
  const totalSentiment =
    kpis.sentimentBreakdown.positive +
    kpis.sentimentBreakdown.neutral +
    kpis.sentimentBreakdown.negative

  const sentimentScore =
    totalSentiment > 0
      ? Math.round((kpis.sentimentBreakdown.positive / totalSentiment) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        label="Visibility Score"
        value={kpis.visibilityScore}
        delta={kpis.visibilityDelta}
        deltaLabel=" vs 30d"
        description="Weighted AI presence score"
      />
      <KpiCard
        label="Share of AI Voice"
        value={kpis.shareOfVoice}
        suffix="%"
        delta={kpis.shareOfVoiceDelta || null}
        description="Brand mentions / total mentions"
      />
      <KpiCard
        label="Avg Position"
        value={kpis.avgPosition !== null ? kpis.avgPosition : '—'}
        delta={kpis.avgPositionDelta}
        description="Mean rank in AI responses"
      />
      <KpiCard
        label="Citation Rate"
        value={kpis.citationRate}
        suffix="%"
        description="Prompts with brand URL cited"
      />
      <KpiCard
        label="Positive Sentiment"
        value={sentimentScore}
        suffix="%"
        description={`${kpis.sentimentBreakdown.positive} positive / ${totalSentiment} total mentions`}
      />
    </div>
  )
}
