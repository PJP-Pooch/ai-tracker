'use client'

import { useState } from 'react'
import { updateProject, deleteProject } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row']

export function ProjectTab({ project, isAdmin }: { project: Project; isAdmin: boolean }) {
  const [error, setError] = useState<string | null>(null)

  async function handleUpdate(formData: FormData) {
    const result = await updateProject(project.id, formData)
    if (result?.error) setError(result.error)
  }

  async function handleDelete() {
    if (!confirm('Delete this project and all its data? This cannot be undone.')) return
    await deleteProject(project.id)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Project Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" defaultValue={project.name} disabled={!isAdmin} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {isAdmin && <Button type="submit">Save Changes</Button>}
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Permanently delete this project and all its data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDelete}>Delete Project</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
