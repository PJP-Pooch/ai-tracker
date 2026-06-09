'use client'

import { useState } from 'react'
import { createCompetitor, deleteCompetitor } from '@/actions/competitors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Competitor = Database['public']['Tables']['competitors']['Row']

export function CompetitorsTab({
  competitors,
  projectId,
  isAdmin,
}: {
  competitors: Competitor[]
  projectId: string
  isAdmin: boolean
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createCompetitor(projectId, formData)
    if (result?.error) setError(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this competitor?')) return
    await deleteCompetitor(id, projectId)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        {competitors.map((comp) => (
          <Card key={comp.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <span className="font-medium">{comp.name}</span>
                <span className="text-sm text-neutral-500 ml-2">{comp.domain}</span>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comp.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Competitor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Competitor Name</Label>
                  <Input name="name" placeholder="Butternut Box" required />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input name="domain" placeholder="butternutbox.com" required />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit">Add Competitor</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
