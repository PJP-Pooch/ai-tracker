import { getAlignmentIssues, summariseAlignmentIssues } from '@/lib/queries/alignment-issues'
import { AlignmentIssuesView } from '@/components/features/alignment/alignment-issues-view'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function AlignmentPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const issues = await getAlignmentIssues(projectId)
  const summary = summariseAlignmentIssues(issues)

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

      <AlignmentIssuesView issues={issues} summary={summary} projectId={projectId} />
    </div>
  )
}
