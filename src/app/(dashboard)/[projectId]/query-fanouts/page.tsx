import { getProjectQueryFanouts } from '@/lib/queries/query-fanouts'
import { QueryFanoutsTable } from '@/components/features/query-fanouts/query-fanouts-table'

export const dynamic = 'force-dynamic'

export default async function QueryFanoutsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const data = await getProjectQueryFanouts(projectId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Query Fanouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track search rankings for LLM Scraper generated query variations
          </p>
        </div>
      </div>

      <QueryFanoutsTable data={data} />
    </div>
  )
}
