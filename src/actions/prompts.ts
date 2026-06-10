'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export async function createPrompt(projectId: string, formData: FormData) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('prompts').insert({
    project_id: projectId,
    prompt_text: (formData.get('prompt_text') as string).trim(),
    priority: ((formData.get('priority') as string) || 'medium') as 'low' | 'medium' | 'high',
    volume: parseInt(formData.get('volume') as string) || 0,
    intent: ((formData.get('intent') as string) || 'informational') as 'informational' | 'commercial' | 'transactional',
  })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function bulkCreatePrompts(projectId: string, promptLines: string) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const lines = promptLines
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { error: 'No prompts found' }

  const inserts = lines.map((text) => ({
    project_id: projectId,
    prompt_text: text,
    priority: 'medium' as const,
    intent: 'informational' as const,
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true, count: lines.length }
}

export async function bulkCreatePromptsWithOptions(
  projectId: string,
  prompts: Array<{ prompt_text: string; intent?: string; priority?: string; volume?: number }>
) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const inserts = prompts.map((p) => ({
    project_id: projectId,
    prompt_text: p.prompt_text.trim(),
    intent: (p.intent || 'informational') as 'informational' | 'commercial' | 'transactional',
    priority: (p.priority || 'medium') as 'low' | 'medium' | 'high',
    volume: p.volume || 0,
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true, count: prompts.length }
}

export async function updatePrompt(id: string, projectId: string, formData: FormData) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('prompts').update({
    prompt_text: (formData.get('prompt_text') as string).trim(),
    priority: (formData.get('priority') as 'low' | 'medium' | 'high') || 'medium',
    volume: parseInt(formData.get('volume') as string) || 0,
    is_active: formData.get('is_active') !== 'false',
    intent: (formData.get('intent') as 'informational' | 'commercial' | 'transactional') || 'informational',
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function deletePrompt(id: string, projectId: string) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function deleteRunGroup(runIds: string[], projectId: string) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('runs').delete().in('id', runIds)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/prompts`)
  revalidatePath(`/${projectId}/overview`)
  revalidatePath(`/${projectId}/citations`)
  revalidatePath(`/${projectId}/competitors`)
  revalidatePath(`/${projectId}/outreach`)

  return { success: true }
}
