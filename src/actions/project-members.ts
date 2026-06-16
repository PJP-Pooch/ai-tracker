'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireProjectAdmin(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isGlobalAdmin = adminEmails.includes(user.email ?? '')
  if (isGlobalAdmin) return user

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (project?.owner_id !== user.id) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function addProjectMember(projectId: string, formData: FormData) {
  await requireProjectAdmin(projectId)

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { error: 'Email is required' }

  const admin = createAdminClient()

  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return { error: listError.message }

  let target = users.find(u => u.email?.toLowerCase() === email)
  let wasInvited = false

  if (!target) {
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (createError) return { error: createError.message }
    target = userData.user
    wasInvited = true
  }

  const { data: existing } = await admin
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', target.id)
    .maybeSingle()

  if (existing) return { error: 'That user is already a member of this project' }

  const { error } = await admin
    .from('project_members')
    .insert({ project_id: projectId, user_id: target.id })

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return {
    success: wasInvited
      ? `${email} added to project. They can now log in via Google.`
      : `${email} added to project`,
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireProjectAdmin(projectId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}
