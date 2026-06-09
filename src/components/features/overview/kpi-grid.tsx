import { KpiCard } from './kpi-card'
import { BarChart3, Hash, Link2, ThumbsUp } from 'lucide-react'
import type { ExecutiveKPIs } from '@/lib/queries/overview'

interface KpiGridProps {
  kpis: ExecutiveKPIs
}

function VoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
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
        variant="gradient-indigo"
        icon={BarChart3}
      />
      <KpiCard
        label="Share of AI Voice"
        value={kpis.shareOfVoice}
        suffix="%"
        delta={kpis.shareOfVoiceDelta || null}
        description="Brand mentions / total mentions"
        variant="gradient-purple"
        icon={VoiceIcon}
      />
      <KpiCard
        label="Avg Position"
        value={kpis.avgPosition !== null ? kpis.avgPosition : '—'}
        delta={kpis.avgPositionDelta}
        description="Mean rank in AI responses"
        variant="default"
        icon={Hash}
      />
      <KpiCard
        label="Citation Rate"
        value={kpis.citationRate}
        suffix="%"
        description="Prompts with brand URL cited"
        variant="gradient-emerald"
        icon={Link2}
      />
      <KpiCard
        label="Positive Sentiment"
        value={sentimentScore}
        suffix="%"
        description={`${kpis.sentimentBreakdown.positive} positive / ${totalSentiment} total mentions`}
        variant="gradient-amber"
        icon={ThumbsUp}
      />
    </div>
  )
}
