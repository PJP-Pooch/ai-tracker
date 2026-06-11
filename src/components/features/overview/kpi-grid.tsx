import { KpiCard } from './kpi-card'
import { MetricInfo } from '@/components/ui/metric-info'
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
        description="% of AI responses mentioning your brand"
        variant="gradient-indigo"
        icon={BarChart3}
        tooltip={
          <>
            <p><strong>What it is:</strong> The percentage of AI responses that mentioned your brand, across all prompts and all scans.</p>
            <p><strong>With multiple daily runs:</strong> Each scan counts as a separate response. If you scan 4× daily across 10 prompts, that&apos;s 40 data points per platform per day — more scans means a more reliable average, not a higher score.</p>
            <p><strong>Note:</strong> This averages all historical runs. The trend chart below shows how the daily rate changes over time.</p>
          </>
        }
      />
      <KpiCard
        label="Share of AI Voice"
        value={kpis.shareOfVoice}
        suffix="%"
        delta={kpis.shareOfVoiceDelta || null}
        description="Your mentions vs all tracked brands"
        variant="gradient-purple"
        icon={VoiceIcon}
        tooltip={
          <>
            <p><strong>What it is:</strong> Your brand&apos;s mentions as a share of total mentions across all brands and competitors tracked.</p>
            <p><strong>Example:</strong> If AI mentions your brand 6 times and competitors 4 times across all responses, your Share of Voice = 60%.</p>
            <p><strong>Tip:</strong> Use the <strong>Non-Branded</strong> filter for a fair comparison — branded queries naturally inflate your score.</p>
          </>
        }
      />
      <KpiCard
        label="Avg Position"
        value={kpis.avgPosition !== null ? kpis.avgPosition : '—'}
        delta={kpis.avgPositionDelta}
        description="Mean rank when brand appears in a list"
        variant="gradient-sky"
        icon={Hash}
        tooltip={
          <>
            <p><strong>What it is:</strong> The average rank position when your brand appears in an AI response list. Position 1 = recommended first.</p>
            <p><strong>How it&apos;s counted:</strong> Only responses where your brand was mentioned contribute to this average. Responses where you weren&apos;t mentioned are excluded.</p>
            <p>Lower is better — position 1 or 2 means AI consistently leads with your brand.</p>
          </>
        }
      />
      <KpiCard
        label="Citation Rate"
        value={kpis.citationRate}
        suffix="%"
        description="Responses with your domain URL cited"
        variant="gradient-emerald"
        icon={Link2}
        tooltip={
          <>
            <p><strong>What it is:</strong> The percentage of AI responses that included a direct link to your domain — not just a mention, but an actual URL citation.</p>
            <p>A high citation rate means AI is actively pointing users to your site. This is especially valuable as AI-generated answers increasingly replace traditional search results.</p>
          </>
        }
      />
      <div className="rounded-xl p-5 gradient-amber shadow-lg shadow-amber-500/20 border-0 flex flex-col justify-between h-full text-white">
        <div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-white/20">
            <ThumbsUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Sentiment Split
            </p>
            <MetricInfo light>
              <p><strong>What it is:</strong> How AI describes your brand when it mentions you, based on all mentions across all scans.</p>
              <p><strong>Positive</strong> — recommended favorably or with praise.</p>
              <p><strong>Neutral</strong> — factual mention without strong tone.</p>
              <p><strong>Negative</strong> — criticism, caveats, or warnings attached to your brand.</p>
            </MetricInfo>
          </div>
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
