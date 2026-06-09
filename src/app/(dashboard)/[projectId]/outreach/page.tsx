import { getOutreachOpportunities } from '@/lib/queries/outreach'
import { OutreachTable } from '@/components/features/outreach/outreach-table'

export default async function OutreachPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const outreachData = await getOutreachOpportunities(projectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">GEO Outreach Finder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find backlink and PR outreach targets by discovering where AI models cite your competitors, but fail to reference your brand.
        </p>
      </div>

      <OutreachTable data={outreachData} />
    </div>
  )
}
