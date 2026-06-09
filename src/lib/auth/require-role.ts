import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireRole(_role: 'admin' | 'analyst' = 'analyst') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { user, role: 'admin' as const }
}
