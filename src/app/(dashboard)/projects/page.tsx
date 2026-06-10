import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Plus, Shield } from 'lucide-react'
import { RunNowButton } from '@/components/features/prompts/run-now-button'
import { formatLastScanned } from '@/lib/utils'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user.email ?? '')

  // Admins bypass RLS to see all projects; regular users see only their own
  const db = isAdmin ? createAdminClient() : supabase

  const { data: projects } = await db
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const { data: latestRuns } = await db
    .from('runs')
    .select('run_date, prompts!inner(project_id)')
    .eq('status', 'success')
    .order('run_date', { ascending: false })

  const lastScannedByProject: Record<string, string> = {}
  if (latestRuns) {
    for (const run of latestRuns) {
      const projId = (run.prompts as any)?.project_id
      if (projId && !lastScannedByProject[projId]) {
        lastScannedByProject[projId] = run.run_date
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Your Projects</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin/members">
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Members
              </Button>
            </Link>
          )}
          <Link href="/projects/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => {
            const lastScanned = lastScannedByProject[project.id]
            const formattedLastScanned = formatLastScanned(lastScanned)
            return (
              <div key={project.id} className="relative group rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                <Link href={`/${project.id}/overview`} className="block p-6">
                  <div className="space-y-1.5 mb-2">
                    <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2 text-lg">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      {project.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {formattedLastScanned ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last scanned: <span className="font-medium text-foreground">{formattedLastScanned}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Never scanned</p>
                  )}
                  <div className="mt-6">
                    <p className="text-sm text-indigo-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Open dashboard &rarr;
                    </p>
                  </div>
                </Link>
                <div className="absolute bottom-6 right-6 z-10">
                  <RunNowButton projectId={project.id} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No projects yet. Create your first to start tracking.</p>
            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  )
}

