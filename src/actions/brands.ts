'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export async function createBrand(projectId: string, formData: FormData) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('brands').insert({
    project_id: projectId,
    name: (formData.get('name') as string).trim(),
    domain: (formData.get('domain') as string).trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
    is_primary: formData.get('is_primary') === 'true',
  })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function updateBrand(id: string, projectId: string, formData: FormData) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('brands').update({
    name: (formData.get('name') as string).trim(),
    domain: (formData.get('domain') as string).trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function deleteBrand(id: string, projectId: string) {
  const { isAdmin } = await requireRole('admin')
  const supabase = isAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}
