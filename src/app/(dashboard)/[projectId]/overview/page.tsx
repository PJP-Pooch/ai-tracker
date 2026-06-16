import { getExecutiveKPIs, getVisibilityTrend, getPlatformBreakdown, getIntentVisibility } from '@/lib/queries/overview'
import { KpiGrid } from '@/components/features/overview/kpi-grid'
import { ShareOfVoiceGauge } from '@/components/features/overview/share-of-voice-gauge'
import { VisibilityTrendChart } from '@/components/features/overview/visibility-trend-chart'
import { PlatformBreakdownTable } from '@/components/features/overview/platform-breakdown-table'
import { IntentBreakdown } from '@/components/features/overview/intent-breakdown'
import { QueryTypeFilter } from '@/components/features/shared/query-type-filter'
import { CategoryFilter } from '@/components/features/shared/category-filter'
import { createDbClient } from '@/lib/supabase/db'

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const queryType = (sp.queryType as 'all' | 'branded' | 'non_branded') || 'all'
  const category = sp.category || undefined
  const opts = { queryType, category }
  const supabase = await createDbClient()

  // Fetch unique categories for this project
  const { data: prompts } = await supabase
    .from('prompts')
    .select('category')
    .eq('project_id', projectId)
  const categories = Array.from(new Set((prompts ?? []).map((p) => p.category).filter(Boolean))) as string[]

  const [kpis, trend, platformBreakdown, intentVisibility, primaryBrand] = await Promise.all([
    getExecutiveKPIs(projectId, opts),
    getVisibilityTrend(projectId, 30, opts),
    getPlatformBreakdown(projectId, opts),
    getIntentVisibility(projectId, opts),
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
        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          <CategoryFilter categories={categories} />
          <QueryTypeFilter />
          {kpis.lastScanned && (
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/40 border rounded-lg px-3 py-1.5">
              Last scanned: <span className="font-medium text-foreground">{new Date(kpis.lastScanned).toLocaleString()}</span>
            </div>
          )}
        </div>
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
