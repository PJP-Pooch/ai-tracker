import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Service-role client — bypasses RLS. NEVER import in 'use client' files.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
