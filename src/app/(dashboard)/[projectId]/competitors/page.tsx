import { getCompetitorVisibility, getShareOfVoice } from '@/lib/queries/competitors'
import { CompetitorCard } from '@/components/features/competitors/competitor-card'
import { VisibilityTrendChart } from '@/components/features/competitors/visibility-trend-chart'
import { ShareOfVoiceChart } from '@/components/features/competitors/share-of-voice-chart'

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const [competitors, shareOfVoice] = await Promise.all([
    getCompetitorVisibility(projectId, 30),
    getShareOfVoice(projectId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Competitor Analysis</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track visibility across all brands and competitors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {competitors.map((c) => (
          <CompetitorCard key={c.brandId} competitor={c} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VisibilityTrendChart competitors={competitors} />
        </div>
        <div>
          <ShareOfVoiceChart data={shareOfVoice} />
        </div>
      </div>
    </div>
  )
}
