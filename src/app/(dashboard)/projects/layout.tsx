import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectsSidebar } from '@/components/features/nav/projects-sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user.email ?? '')

  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectsSidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 h-14 border-b border-border bg-background/80 backdrop-blur-sm px-6 flex items-center">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <p className="text-xs text-muted-foreground">Manage your AI visibility tracking projects</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
