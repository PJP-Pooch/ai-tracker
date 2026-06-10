import { createClient } from '@/lib/supabase/server'
import { createDbClient } from '@/lib/supabase/db'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandsTab } from '@/components/features/settings/brands-tab'
import { CompetitorsTab } from '@/components/features/settings/competitors-tab'
import { PromptsTab } from '@/components/features/settings/prompts-tab'
import { ProjectTab } from '@/components/features/settings/project-tab'
import { MembersTab } from '@/components/features/settings/members-tab'
import type { ProjectMember } from '@/components/features/settings/members-tab'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()
  const db = await createDbClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await db.from('projects').select('*').eq('id', projectId).single()
  if (!project) redirect('/projects')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = project.owner_id === user.id || adminEmails.includes(user.email ?? '')

  const [{ data: brands }, { data: competitors }, { data: prompts }] = await Promise.all([
    db.from('brands').select('*').eq('project_id', projectId).order('created_at'),
    db.from('competitors').select('*').eq('project_id', projectId).order('created_at'),
    db.from('prompts').select('*').eq('project_id', projectId).order('created_at'),
  ])

  let members: ProjectMember[] = []
  if (isAdmin) {
    const admin = createAdminClient()
    const { data: memberRows } = await admin
      .from('project_members')
      .select('user_id, added_at')
      .eq('project_id', projectId)

    if (memberRows?.length) {
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const memberIds = new Set(memberRows.map(m => m.user_id))
      members = users
        .filter(u => memberIds.has(u.id))
        .map(u => ({
          id: u.id,
          email: u.email ?? '',
          added_at: memberRows.find(m => m.user_id === u.id)?.added_at ?? '',
          pending: !u.last_sign_in_at,
        }))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Project Settings</h1>

      <Tabs defaultValue="brands">
        <TabsList className="mb-6">
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          {isAdmin && <TabsTrigger value="members">Members</TabsTrigger>}
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

        {isAdmin && (
          <TabsContent value="members">
            <MembersTab members={members} projectId={projectId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
