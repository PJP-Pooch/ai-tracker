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

  const [data, { data: brands }, { data: competitors }] = await Promise.all([
    getPromptsWithStats(projectId, {
      platform: sp.platform,
      priority: sp.priority,
      search: sp.search,
      intent: sp.intent,
    }),
    supabase.from('brands').select('name').eq('project_id', projectId),
    supabase.from('competitors').select('name').eq('project_id', projectId),
  ])

  const trackedBrandNames = [
    ...(brands ?? []).map((b) => b.name),
    ...(competitors ?? []).map((c) => c.name),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompt Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.length} prompt{data.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div>
          <Link href={`/${projectId}/settings?tab=prompts`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage Prompts
            </Button>
          </Link>
        </div>
      </div>

      <PromptsFilters />
      <PromptsTable data={data} projectId={projectId} trackedBrandNames={trackedBrandNames} />
    </div>
  )
}
