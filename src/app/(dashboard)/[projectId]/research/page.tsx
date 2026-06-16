import { createDbClient } from '@/lib/supabase/db'
import { redirect } from 'next/navigation'
import { PromptResearch } from '@/components/features/research/prompt-research'

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createDbClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (!project) redirect('/projects')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Prompt Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover AI search prompts by market and add them to your tracking list
        </p>
      </div>
      <PromptResearch projectId={projectId} />
    </div>
  )
}
