import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPromptPipeline } from '@/lib/pipeline/prompt-runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { projectId: string }
  const { projectId } = body
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user.email ?? '')
  const db = isAdmin ? createAdminClient() : supabase

  // Admins can run any project; regular users must own it
  const projectQuery = db.from('projects').select('id').eq('id', projectId)
  if (!isAdmin) projectQuery.eq('owner_id', user.id)
  const { data: project } = await projectQuery.single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const admin = createAdminClient()

  const { data: prompts, error } = await admin
    .from('prompts')
    .select(`
      id,
      prompt_text,
      project_id,
      projects!inner (
        platforms,
        brands ( id, name, domain ),
        competitors ( id, domain )
      )
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ message: 'No active prompts', succeeded: 0, failed: 0, total: 0 })
  }

  const pipelineResults = []
  for (const prompt of prompts) {
    const p = prompt as unknown as {
      projects: {
        platforms: string[]
        brands: { id: string; name: string; domain: string }[]
        competitors: { id: string; domain: string }[]
      }
    }
    const res = await runPromptPipeline({
      id: prompt.id,
      prompt_text: prompt.prompt_text,
      project_id: prompt.project_id,
      brands: p.projects?.brands ?? [],
      competitors: p.projects?.competitors ?? [],
      platforms: p.projects?.platforms ?? ['chatgpt', 'gemini'],
    })
    pipelineResults.push(res)
  }

  const succeeded = pipelineResults.reduce((sum, r) => sum + r.succeeded, 0)
  const failed = pipelineResults.reduce((sum, r) => sum + r.failed, 0)
  const errors = pipelineResults.flatMap((r) => r.errors)

  const totalRuns = prompts.reduce((sum, p) => {
    const project = (p as unknown as { projects: { platforms: string[] } }).projects
    return sum + (project?.platforms?.length ?? 2)
  }, 0)

  return NextResponse.json({ succeeded, failed, total: totalRuns, errors })
}
