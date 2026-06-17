import { getAlignmentIssues, getAlignmentTopics, summariseAlignmentIssues } from '@/lib/queries/alignment-issues'
import { getPromptsWithStats } from '@/lib/queries/prompts'
import { AlignmentIssuesView } from '@/components/features/alignment/alignment-issues-view'
import { createDbClient } from '@/lib/supabase/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function AlignmentPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createDbClient()

  // Fetch all data in parallel
  const [issues, topics, critiquePrompts, { data: brands }, { data: competitors }, { data: project }] = await Promise.all([
    getAlignmentIssues(projectId),
    getAlignmentTopics(projectId),
    getPromptsWithStats(projectId, { isCritique: true }),
    supabase.from('brands').select('name').eq('project_id', projectId),
    supabase.from('competitors').select('name').eq('project_id', projectId),
    supabase.from('projects').select('alignment_check_mode').eq('id', projectId).single(),
  ])

  const summary = summariseAlignmentIssues(issues)
  const trackedBrandNames = [
    ...(brands ?? []).map((b) => b.name),
    ...(competitors ?? []).map((c) => c.name),
  ]
  const alignmentCheckMode = ((project as unknown as { alignment_check_mode?: string } | null)?.alignment_check_mode ?? 'off') as 'off' | 'manual' | 'auto'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Alignment Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI responses that contradict your brand positioning
          </p>
        </div>
        <Link href={`/${projectId}/settings?tab=intelligence`}>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Brand Intelligence
          </Button>
        </Link>
      </div>

      <AlignmentIssuesView
        issues={issues}
        summary={summary}
        topics={topics}
        projectId={projectId}
        critiquePrompts={critiquePrompts}
        trackedBrandNames={trackedBrandNames}
        alignmentCheckMode={alignmentCheckMode}
      />
    </div>
  )
}
