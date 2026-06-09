'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const { user } = await requireRole('admin')
  const supabase = await createClient()

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Project name is required' }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, owner_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  redirect(`/${data.id}/settings`)
}

export async function updateProject(id: string, formData: FormData) {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update({ name: (formData.get('name') as string).trim() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${id}/settings`)
  return { success: true }
}

export async function deleteProject(id: string) {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }

  redirect('/projects')
}
