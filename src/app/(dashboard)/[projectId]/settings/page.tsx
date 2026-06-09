import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandsTab } from '@/components/features/settings/brands-tab'
import { CompetitorsTab } from '@/components/features/settings/competitors-tab'
import { PromptsTab } from '@/components/features/settings/prompts-tab'
import { ProjectTab } from '@/components/features/settings/project-tab'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: brands }, { data: competitors }, { data: prompts }, { data: profile }] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('brands').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('competitors').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('prompts').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('user_profiles').select('role').eq('id', user.id).single(),
    ])

  if (!project) redirect('/projects')

  const isAdmin = profile?.role === 'admin'

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Project Settings</h1>

      <Tabs defaultValue="brands">
        <TabsList className="mb-6">
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          <ProjectTab project={project} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab brands={brands ?? []} projectId={projectId} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorsTab competitors={competitors ?? []} projectId={projectId} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptsTab prompts={prompts ?? []} projectId={projectId} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
