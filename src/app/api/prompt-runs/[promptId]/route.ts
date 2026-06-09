import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPromptRunHistory } from '@/lib/queries/prompts'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { promptId } = await params
  const runs = await getPromptRunHistory(promptId)
  return NextResponse.json(runs)
}
