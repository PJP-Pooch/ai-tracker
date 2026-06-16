import { createClient } from '@/lib/supabase/server'
import { createDbClient } from '@/lib/supabase/db'
import { redirect, notFound } from 'next/navigation'
import { getPromptRunHistory } from '@/lib/queries/prompts'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PromptPerformanceChart } from '@/components/features/prompts/prompt-performance-chart'
import { PromptRunsList } from '@/components/features/prompts/prompt-runs-list'
import { cn } from '@/lib/utils'

const intentColors: Record<string, string> = {
  transactional: 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
  commercial: 'bg-purple-100/60 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50',
  informational: 'bg-sky-100/60 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50',
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; promptId: string }>
}) {
  const { projectId, promptId } = await params
  const supabase = await createClient()
  const db = await createDbClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prompt } = await db
    .from('prompts')
    .select('id, prompt_text, priority, volume, intent, category')
    .eq('id', promptId)
    .single()

  if (!prompt) notFound()

  const [runs, { data: primaryBrand }, { data: brands }, { data: competitors }] = await Promise.all([
    getPromptRunHistory(promptId, 30),
    db
      .from('brands')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .maybeSingle(),
    db.from('brands').select('name').eq('project_id', projectId),
    db.from('competitors').select('name').eq('project_id', projectId),
  ])

  const brandId = primaryBrand?.id ?? null
  const trackedBrandNames = [
    ...(brands ?? []).map((b) => b.name),
    ...(competitors ?? []).map((c) => c.name),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${projectId}/prompts`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prompts
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{prompt.prompt_text}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 rounded-full text-xs font-medium", intentColors[prompt.intent || 'informational'])}>
                {prompt.intent || 'informational'} intent
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <PromptPerformanceChart runs={runs} brandId={brandId} />

      <PromptRunsList
        runs={runs}
        brandId={brandId}
        trackedBrandNames={trackedBrandNames}
        prompt={prompt}
        projectId={projectId}
      />
    </div>
  )
}
