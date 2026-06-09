import { getPromptsWithStats } from '@/lib/queries/prompts'
import { PromptsTable } from '@/components/features/prompts/prompts-table'
import { PromptsFilters } from '@/components/features/prompts/prompts-filters'
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

  const data = await getPromptsWithStats(projectId, {
    platform: sp.platform,
    priority: sp.priority,
    search: sp.search,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Prompt Tracking</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {data.length} prompt{data.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link href={`/${projectId}/settings?tab=prompts`}>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Manage Prompts
          </Button>
        </Link>
      </div>

      <PromptsFilters />
      <PromptsTable data={data} projectId={projectId} />
    </div>
  )
}
