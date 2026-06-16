'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const { user } = await requireRole('analyst')
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
  const { user, isAdmin } = await requireRole('analyst')
  const db = isAdmin ? createAdminClient() : await createClient()

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Project name is required' }

  const scheduleFrequency = formData.get('schedule_frequency') as string
  const platforms = formData.getAll('platforms') as string[]

  if (platforms.length === 0) {
    return { error: 'At least one platform must be selected' }
  }

  const { error } = await db
    .from('projects')
    .update({
      name,
      schedule_frequency: scheduleFrequency as 'paused' | 'daily' | 'twice_daily' | 'four_times_daily' | 'weekly',
      platforms,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${id}/settings`)
  return { success: true }
}

export async function deleteProject(id: string) {
  const { user, isAdmin } = await requireRole('analyst')
  const db = isAdmin ? createAdminClient() : await createClient()

  const { error } = await db.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }

  redirect('/projects')
}
