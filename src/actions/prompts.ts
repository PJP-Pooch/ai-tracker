'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

function normalizeBrand(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim()
}

function detectBranded(promptText: string, brandName: string): boolean {
  return normalizeBrand(promptText).includes(normalizeBrand(brandName))
}

async function getPrimaryBrandName(supabase: ReturnType<typeof createAdminClient>, projectId: string): Promise<string | null> {
  const { data } = await supabase
    .from('brands')
    .select('name')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .maybeSingle()
  return data?.name ?? null
}

export async function createPrompt(projectId: string, formData: FormData) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const promptText = (formData.get('prompt_text') as string).trim()
  const brandName = await getPrimaryBrandName(supabase, projectId)
  const isBranded = brandName ? detectBranded(promptText, brandName) : false
  const category = (formData.get('category') as string)?.trim() || null
  const isCritique = formData.get('is_critique') === 'true'

  const { error } = await supabase.from('prompts').insert({
    project_id: projectId,
    prompt_text: promptText,
    priority: ((formData.get('priority') as string) || 'medium') as 'low' | 'medium' | 'high',
    volume: parseInt(formData.get('volume') as string) || 0,
    intent: ((formData.get('intent') as string) || 'informational') as 'informational' | 'commercial' | 'transactional',
    is_branded: isBranded,
    category,
    is_critique: isCritique,
  })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function bulkCreatePrompts(projectId: string, promptLines: string, category?: string) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const lines = promptLines
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { error: 'No prompts found' }

  const brandName = await getPrimaryBrandName(supabase, projectId)
  const cleanCategory = category?.trim() || null

  const inserts = lines.map((text) => ({
    project_id: projectId,
    prompt_text: text,
    priority: 'medium' as const,
    intent: 'informational' as const,
    is_branded: brandName ? detectBranded(text, brandName) : false,
    category: cleanCategory,
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true, count: lines.length }
}

export async function bulkCreatePromptsWithOptions(
  projectId: string,
  prompts: Array<{ prompt_text: string; intent?: string; priority?: string; volume?: number; is_branded?: boolean; category?: string }>
) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const brandName = await getPrimaryBrandName(supabase, projectId)

  const inserts = prompts.map((p) => ({
    project_id: projectId,
    prompt_text: p.prompt_text.trim(),
    intent: (p.intent || 'informational') as 'informational' | 'commercial' | 'transactional',
    priority: (p.priority || 'medium') as 'low' | 'medium' | 'high',
    volume: p.volume || 0,
    is_branded: p.is_branded ?? (brandName ? detectBranded(p.prompt_text.trim(), brandName) : false),
    category: p.category?.trim() || null,
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true, count: prompts.length }
}

export async function updatePrompt(id: string, projectId: string, formData: FormData) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const promptText = (formData.get('prompt_text') as string).trim()
  const brandName = await getPrimaryBrandName(supabase, projectId)
  const isBranded = brandName ? detectBranded(promptText, brandName) : false
  const category = (formData.get('category') as string)?.trim() || null
  const isCritique = formData.get('is_critique') === 'true'

  const { error } = await supabase.from('prompts').update({
    prompt_text: promptText,
    priority: (formData.get('priority') as 'low' | 'medium' | 'high') || 'medium',
    volume: parseInt(formData.get('volume') as string) || 0,
    is_active: formData.get('is_active') !== 'false',
    intent: (formData.get('intent') as 'informational' | 'commercial' | 'transactional') || 'informational',
    is_branded: isBranded,
    category,
    is_critique: isCritique,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function deletePrompt(id: string, projectId: string) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  revalidatePath(`/${projectId}/prompts`)
  return { success: true }
}

export async function deleteRunGroup(runIds: string[], projectId: string) {
  const { user, isAdmin } = await requireRole('analyst')
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

export async function generateDefaultCritiquePrompts(projectId: string) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const brandName = await getPrimaryBrandName(supabase, projectId)
  if (!brandName) return { error: 'No primary brand found' }

  const templates = [
    `What are the most common complaints or negative reviews about ${brandName}?`,
    `Why do some customers choose competitors over ${brandName}?`,
    `What are the comparative weaknesses or disadvantages of ${brandName}?`,
    `Is ${brandName} overpriced, or is there a better alternative?`
  ]

  const inserts = templates.map((text) => ({
    project_id: projectId,
    prompt_text: text,
    priority: 'medium' as const,
    intent: 'commercial' as const,
    is_branded: true,
    is_active: true,
    is_critique: true,
    category: 'Critiques',
  }))

  const { error } = await supabase.from('prompts').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/alignment`)
  revalidatePath(`/${projectId}/settings`)
  return { success: true, count: templates.length }
}
