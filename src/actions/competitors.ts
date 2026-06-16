'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export async function createCompetitor(projectId: string, formData: FormData) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('competitors').insert({
    project_id: projectId,
    name: (formData.get('name') as string).trim(),
    domain: (formData.get('domain') as string).trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function updateCompetitor(id: string, projectId: string, formData: FormData) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('competitors').update({
    name: (formData.get('name') as string).trim(),
    domain: (formData.get('domain') as string).trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function deleteCompetitor(id: string, projectId: string) {
  const { user, isAdmin } = await requireRole('analyst')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('competitors').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}
