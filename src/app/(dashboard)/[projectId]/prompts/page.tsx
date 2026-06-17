import { getPromptsWithStats } from '@/lib/queries/prompts'
import { PromptsTable } from '@/components/features/prompts/prompts-table'
import { PromptsFilters } from '@/components/features/prompts/prompts-filters'
import { createDbClient } from '@/lib/supabase/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function PromptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const supabase = await createDbClient()

  const showCritiques = sp.showCritiques === 'true'

  const [data, critiqueData, { data: brands }, { data: competitors }, { data: project }] = await Promise.all([
    getPromptsWithStats(projectId, {
      platform: sp.platform,
      priority: sp.priority,
      search: sp.search,
      intent: sp.intent,
      queryType: sp.queryType as 'all' | 'branded' | 'non_branded' | undefined,
      dateRange: sp.dateRange as 'today' | 'yesterday' | '7days' | '30days' | 'all' | undefined,
    }),
    showCritiques ? getPromptsWithStats(projectId, { isCritique: true }) : Promise.resolve([]),
    supabase.from('brands').select('name').eq('project_id', projectId),
    supabase.from('competitors').select('name').eq('project_id', projectId),
    supabase.from('projects').select('alignment_check_mode').eq('id', projectId).single(),
  ])

  const allPrompts = showCritiques ? [...data, ...critiqueData] : data

  const trackedBrandNames = [
    ...(brands ?? []).map((b) => b.name),
    ...(competitors ?? []).map((c) => c.name),
  ]

  const alignmentCheckMode = ((project as unknown as { alignment_check_mode?: string } | null)?.alignment_check_mode ?? 'off') as 'off' | 'manual' | 'auto'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompt Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.length} prompt{data.length !== 1 ? 's' : ''} tracked{showCritiques && critiqueData.length > 0 ? ` · ${critiqueData.length} critique` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${projectId}/settings?tab=prompts`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage Prompts
            </Button>
          </Link>
        </div>
      </div>

      <PromptsFilters />
      <PromptsTable data={allPrompts} projectId={projectId} trackedBrandNames={trackedBrandNames} alignmentCheckMode={alignmentCheckMode} />
    </div>
  )
}
