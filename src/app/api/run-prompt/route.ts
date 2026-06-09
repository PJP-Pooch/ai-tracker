import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPromptPipeline } from '@/lib/pipeline/prompt-runner'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const body = await req.json() as { promptId: string }
  const { promptId } = body

  if (!promptId) {
    return NextResponse.json({ error: 'promptId required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: prompt, error } = await admin
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
    .eq('id', promptId)
    .single()

  if (error || !prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
  }

  const project = (prompt as unknown as { projects: { brands: { id: string; name: string; domain: string }[]; competitors: { id: string; domain: string }[] } }).projects

  await runPromptPipeline({
    id: prompt.id,
    prompt_text: prompt.prompt_text,
    project_id: prompt.project_id,
    brands: project?.brands ?? [],
    competitors: project?.competitors ?? [],
  })

  return NextResponse.json({ success: true })
}
