import { getOutreachOpportunities } from '@/lib/queries/outreach'
import { OutreachTable } from '@/components/features/outreach/outreach-table'
import { createDbClient } from '@/lib/supabase/db'

export default async function OutreachPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const outreachData = await getOutreachOpportunities(projectId)
  
  const supabase = await createDbClient()
  const { data: competitors } = await supabase
    .from('competitors')
    .select('name')
    .eq('project_id', projectId)
    .order('name', { ascending: true })

  const competitorNames = (competitors ?? []).map((c) => c.name)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Outreach Finder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find backlink and PR outreach targets by discovering where AI models cite your competitors, but fail to reference your brand.
        </p>
      </div>

      <OutreachTable data={outreachData} competitorNames={competitorNames} />
    </div>
  )
}
