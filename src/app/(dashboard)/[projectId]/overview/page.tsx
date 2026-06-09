import { getExecutiveKPIs, getVisibilityTrend, getPlatformBreakdown, getIntentVisibility } from '@/lib/queries/overview'
import { KpiGrid } from '@/components/features/overview/kpi-grid'
import { ShareOfVoiceGauge } from '@/components/features/overview/share-of-voice-gauge'
import { VisibilityTrendChart } from '@/components/features/overview/visibility-trend-chart'
import { PlatformBreakdownTable } from '@/components/features/overview/platform-breakdown-table'
import { IntentBreakdown } from '@/components/features/overview/intent-breakdown'
import { createClient } from '@/lib/supabase/server'

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const [kpis, trend, platformBreakdown, intentVisibility, primaryBrand] = await Promise.all([
    getExecutiveKPIs(projectId),
    getVisibilityTrend(projectId, 30),
    getPlatformBreakdown(projectId),
    getIntentVisibility(projectId),
    supabase
      .from('brands')
      .select('name')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .maybeSingle(),
  ])

  const primaryBrandName = primaryBrand?.data?.name ?? 'Own Brand'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI brand visibility summary across all platforms
          </p>
        </div>
        {kpis.lastScanned && (
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted/40 border rounded-lg px-3 py-1.5 self-start sm:self-auto">
            Last scanned: <span className="font-medium text-foreground">{new Date(kpis.lastScanned).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div>
        <KpiGrid kpis={kpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VisibilityTrendChart data={trend} brandName={primaryBrandName} />
        </div>
        <div>
          <ShareOfVoiceGauge value={kpis.shareOfVoice} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlatformBreakdownTable data={platformBreakdown} />
        </div>
        <div>
          <IntentBreakdown data={intentVisibility} />
        </div>
      </div>
    </div>
  )
}
