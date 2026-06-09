import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPromptPipeline } from '@/lib/pipeline/prompt-runner'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(`
      id,
      prompt_text,
      project_id,
      projects!inner (
        brands ( id, name, domain ),
        competitors ( id, domain )
      )
    `)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ message: 'No active prompts', total: 0 })
  }

  // Fan out — run each prompt through the pipeline
  const results = await Promise.allSettled(
    prompts.map((prompt) => {
      const project = (prompt as unknown as { projects: { brands: { id: string; name: string; domain: string }[]; competitors: { id: string; domain: string }[] } }).projects
      return runPromptPipeline({
        id: prompt.id,
        prompt_text: prompt.prompt_text,
        project_id: prompt.project_id,
        brands: project?.brands ?? [],
        competitors: project?.competitors ?? [],
      })
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ succeeded, failed, total: prompts.length })
}
