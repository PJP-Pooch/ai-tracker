import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Plus, Shield } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { RunNowButton } from '@/components/features/prompts/run-now-button'
import { formatLastScanned } from '@/lib/utils'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user.email ?? '')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  // Fetch the latest successful runs to find last scanned dates per project
  const { data: latestRuns } = await supabase
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your AI visibility tracking projects</p>
          </div>
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
              <Button>
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
          <Card className="text-center py-12">
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
      </div>
      <Toaster />
    </div>
  )
}

