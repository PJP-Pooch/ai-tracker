'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export async function createPrompt(projectId: string, formData: FormData) {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('prompts').insert({
    project_id: projectId,
    prompt_text: (formData.get('prompt_text') as string).trim(),
    priority: ((formData.get('priority') as string) || 'medium') as 'low' | 'medium' | 'high',
    volume: parseInt(formData.get('volume') as string) || 0,
  })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function bulkCreatePrompts(projectId: string, promptLines: string) {
  await requireRole('admin')
  const supabase = await createClient()

  const lines = promptLines
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { error: 'No prompts found' }

  const inserts = lines.map((text) => ({
    project_id: projectId,
    prompt_text: text,
    priority: 'medium' as const,
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true, count: lines.length }
}

export async function updatePrompt(id: string, projectId: string, formData: FormData) {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('prompts').update({
    prompt_text: (formData.get('prompt_text') as string).trim(),
    priority: (formData.get('priority') as 'low' | 'medium' | 'high') || 'medium',
    volume: parseInt(formData.get('volume') as string) || 0,
    is_active: formData.get('is_active') !== 'false',
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function deletePrompt(id: string, projectId: string) {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}
