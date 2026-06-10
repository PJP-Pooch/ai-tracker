import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/features/nav/sidebar'
import { Header } from '@/components/features/nav/header'
import { Toaster } from '@/components/ui/sonner'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user.email ?? '')
  const db = isAdmin ? createAdminClient() : supabase

  const { data: project } = await db
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (!project) redirect('/projects')

  // Fetch the latest successful run date for prompts belonging to this project
  const { data: latestRun } = await db
    .from('runs')
    .select('run_date, prompts!inner(project_id)')
    .eq('status', 'success')
    .eq('prompts.project_id', projectId)
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastScanned = latestRun?.run_date ?? null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar projectId={projectId} projectName={project.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={project.name}
          subtitle="AI Visibility Dashboard"
          projectId={projectId}
          lastScanned={lastScanned}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
