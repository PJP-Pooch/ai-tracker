import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireRole(role: 'admin' | 'analyst' = 'analyst') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (role === 'admin' && profile.role !== 'admin') {
    redirect('/projects?error=unauthorized')
  }

  return { user, role: profile.role as 'admin' | 'analyst' }
}
