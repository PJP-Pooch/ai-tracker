import { getCompetitorVisibility, getShareOfVoice, getCompetitorGapMatrix } from '@/lib/queries/competitors'
import { CompetitorCard } from '@/components/features/competitors/competitor-card'
import { VisibilityTrendChart } from '@/components/features/competitors/visibility-trend-chart'
import { ShareOfVoiceChart } from '@/components/features/competitors/share-of-voice-chart'
import { GapMatrixTable } from '@/components/features/competitors/gap-matrix-table'

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const [competitors, shareOfVoice, gapMatrix] = await Promise.all([
    getCompetitorVisibility(projectId, 30),
    getShareOfVoice(projectId),
    getCompetitorGapMatrix(projectId),
  ])

  const ownBrand = competitors.find((c) => c.isOwn)
  const ownBrandName = ownBrand?.brandName ?? 'Your Brand'
  const competitorNames = competitors.filter((c) => !c.isOwn).map((c) => c.brandName)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Competitor Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track visibility across all brands and competitors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

      <div className="pt-2">
        <GapMatrixTable
          data={gapMatrix}
          competitorNames={competitorNames}
          ownBrandName={ownBrandName}
        />
      </div>
    </div>
  )
}
