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
        platforms,
        schedule_frequency,
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

  // Determine the current schedule slot
  const currentHour = new Date().getUTCHours()
  const currentDay = new Date().getUTCDay() // 0 = Sunday, 1 = Monday, etc.

  // Filter prompts matching the schedule criteria
  const promptsToRun = prompts.filter((prompt) => {
    const project = (prompt as unknown as { projects: { schedule_frequency: string } }).projects
    const freq = project?.schedule_frequency ?? 'four_times_daily'

    switch (freq) {
      case 'paused':
        return false
      case 'daily':
        // Run only at the 8 AM UTC slot
        return currentHour === 8
      case 'twice_daily':
        // Run at 8 AM and 8 PM UTC slots
        return currentHour === 8 || currentHour === 20
      case 'four_times_daily':
        // Run at all slots (8, 12, 16, 20 UTC)
        return true
      case 'weekly':
        // Run only on Mondays at 8 AM UTC
        return currentDay === 1 && currentHour === 8
      default:
        return true
    }
  })

  if (promptsToRun.length === 0) {
    return NextResponse.json({ message: 'No prompts scheduled for this slot', total: 0 })
  }

  // Fan out — run each prompt through the pipeline using its project platforms
  const results = await Promise.allSettled(
    promptsToRun.map((prompt) => {
      const project = (prompt as unknown as {
        projects: {
          platforms: string[]
          brands: { id: string; name: string; domain: string }[]
          competitors: { id: string; domain: string }[]
        }
      }).projects

      return runPromptPipeline({
        id: prompt.id,
        prompt_text: prompt.prompt_text,
        project_id: prompt.project_id,
        brands: project?.brands ?? [],
        competitors: project?.competitors ?? [],
        platforms: project?.platforms ?? ['chatgpt', 'gemini'],
      })
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ succeeded, failed, total: promptsToRun.length })
}
