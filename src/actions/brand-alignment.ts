'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'
import { scrapeUrl } from '@/lib/firecrawl/client'
import { summarisePageAsBrandBrief } from '@/lib/openai/brand-alignment'

export async function saveBrandIntelligenceSettings(
  projectId: string,
  positioning: string,
  checkMode: 'off' | 'manual' | 'auto'
) {
  await requireRole('admin')
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('projects')
    .update({ brand_positioning: positioning, alignment_check_mode: checkMode })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath(`/${projectId}/settings`)
  return { success: true }
}

export async function generateBrandBriefFromHomepage(
  projectId: string
): Promise<{ brief?: string; error?: string }> {
  await requireRole('admin')
  const supabase = createAdminClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('name, domain')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .maybeSingle()

  if (!brand) return { error: 'No primary brand found for this project.' }

  const url = brand.domain.startsWith('http') ? brand.domain : `https://${brand.domain}`
  const page = await scrapeUrl(url)

  if (!page) return { error: `Could not fetch ${url}. Check the domain is correct and publicly accessible.` }

  const brief = await summarisePageAsBrandBrief(page.markdown, brand.name)
  if (!brief) return { error: 'Could not generate a brief from the homepage content.' }

  return { brief }
}
