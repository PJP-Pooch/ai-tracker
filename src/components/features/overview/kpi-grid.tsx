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

  const posPct = totalSentiment > 0 ? Math.round((kpis.sentimentBreakdown.positive / totalSentiment) * 100) : 0
  const negPct = totalSentiment > 0 ? Math.round((kpis.sentimentBreakdown.negative / totalSentiment) * 100) : 0
  const neuPct = totalSentiment > 0 ? Math.max(0, 100 - posPct - negPct) : 0

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
        variant="gradient-sky"
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
      <div className="rounded-xl p-5 gradient-amber shadow-lg shadow-amber-500/20 border-0 flex flex-col justify-between h-full text-white">
        <div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-white/20">
            <ThumbsUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1 text-white/70">
            Sentiment Split
          </p>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {posPct}%
                </span>
                <span className="text-[10px] text-white/70 font-medium uppercase">
                  Pos
                </span>
              </div>
              <div className="flex flex-col border-x border-white/20">
                <span className="text-sm font-bold text-white">
                  {neuPct}%
                </span>
                <span className="text-[10px] text-white/70 font-medium uppercase">
                  Neu
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {negPct}%
                </span>
                <span className="text-[10px] text-white/70 font-medium uppercase">
                  Neg
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/25">
              {totalSentiment > 0 ? (
                <>
                  {posPct > 0 && (
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${posPct}%` }} />
                  )}
                  {neuPct > 0 && (
                    <div className="bg-white/45 h-full transition-all" style={{ width: `${neuPct}%` }} />
                  )}
                  {negPct > 0 && (
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${negPct}%` }} />
                  )}
                </>
              ) : (
                <div className="bg-white/10 h-full w-full" />
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-white/60 mt-3">
          {totalSentiment} total mentions
        </p>
      </div>
    </div>
  )
}
