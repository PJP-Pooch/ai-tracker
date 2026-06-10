'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (!user || !adminEmails.includes(user.email ?? '')) {
    throw new Error('Unauthorized')
  }
}

export async function inviteUser(formData: FormData) {
  await requireAdmin()
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const admin = createAdminClient()
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createError) return { error: createError.message }

  revalidatePath('/admin/members')
  return { success: `Added ${email}. They can now log in via Google.` }
}

export async function deleteUser(userId: string) {
  await requireAdmin()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) return { error: 'You cannot remove yourself' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}
