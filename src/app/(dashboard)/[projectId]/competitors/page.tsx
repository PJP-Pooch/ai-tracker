import { getCompetitorVisibility, getShareOfVoice, getCompetitorGapMatrix } from '@/lib/queries/competitors'
import { CompetitorCard } from '@/components/features/competitors/competitor-card'
import { VisibilityTrendChart } from '@/components/features/competitors/visibility-trend-chart'
import { ShareOfVoiceChart } from '@/components/features/competitors/share-of-voice-chart'
import { GapMatrixTable } from '@/components/features/competitors/gap-matrix-table'
import { QueryTypeFilter } from '@/components/features/shared/query-type-filter'
import { CategoryFilter } from '@/components/features/shared/category-filter'
import { createDbClient } from '@/lib/supabase/db'

export default async function CompetitorsPage({
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

  const [competitors, shareOfVoice, gapMatrix] = await Promise.all([
    getCompetitorVisibility(projectId, 30, undefined, opts),
    getShareOfVoice(projectId, opts),
    getCompetitorGapMatrix(projectId, opts),
  ])

  const ownBrand = competitors.find((c) => c.isOwn)
  const ownBrandName = ownBrand?.brandName ?? 'Your Brand'
  const competitorNames = competitors.filter((c) => !c.isOwn).map((c) => c.brandName)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competitor Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track visibility across all brands and competitors
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          <CategoryFilter categories={categories} />
          <QueryTypeFilter />
        </div>
      </div>

      {queryType !== 'non_branded' && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>
            <strong className="font-semibold">Branded queries included.</strong>{' '}
            Queries that mention your brand name (e.g. &ldquo;Is Pooch &amp; Mutt worth it?&rdquo;) inflate your visibility scores since competitors rarely appear in branded responses. Switch to <strong>Non-Branded</strong> for a fair comparison.
          </span>
        </div>
      )}

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
