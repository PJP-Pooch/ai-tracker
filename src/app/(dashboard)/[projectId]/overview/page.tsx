import { getExecutiveKPIs, getVisibilityTrend, getPlatformBreakdown } from '@/lib/queries/overview'
import { KpiGrid } from '@/components/features/overview/kpi-grid'
import { ShareOfVoiceGauge } from '@/components/features/overview/share-of-voice-gauge'
import { VisibilityTrendChart } from '@/components/features/overview/visibility-trend-chart'
import { PlatformBreakdownTable } from '@/components/features/overview/platform-breakdown-table'

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const [kpis, trend, platformBreakdown] = await Promise.all([
    getExecutiveKPIs(projectId),
    getVisibilityTrend(projectId, 30),
    getPlatformBreakdown(projectId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Executive Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          AI brand visibility summary across all platforms
        </p>
      </div>

      <div className="mb-6">
        <KpiGrid kpis={kpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <VisibilityTrendChart data={trend} />
        </div>
        <div>
          <ShareOfVoiceGauge value={kpis.shareOfVoice} />
        </div>
      </div>

      <PlatformBreakdownTable data={platformBreakdown} />
    </div>
  )
}
