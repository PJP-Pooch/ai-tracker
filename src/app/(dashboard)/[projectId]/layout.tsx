import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/features/nav/sidebar'
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

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (!project) redirect('/projects')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar projectId={projectId} projectName={project.name} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
