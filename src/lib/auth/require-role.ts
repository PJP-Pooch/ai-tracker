import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export async function requireRole(requiredRole: 'admin' | 'analyst' = 'analyst') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Email list takes priority (avoids extra DB round-trip for known admins)
  if (adminEmails.includes(user.email ?? '')) {
    return { user, role: 'admin' as const, isAdmin: true }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'analyst') as 'admin' | 'analyst'

  if (requiredRole === 'admin' && role !== 'admin') redirect('/')

  return { user, role, isAdmin: role === 'admin' }
}
