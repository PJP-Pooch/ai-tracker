'use client'

import { useState } from 'react'
import { addProjectMember, removeProjectMember } from '@/actions/project-members'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserCircle } from 'lucide-react'

export type ProjectMember = {
  id: string
  email: string
  added_at: string
  pending?: boolean
}

export function MembersTab({
  members,
  projectId,
}: {
  members: ProjectMember[]
  projectId: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAdd(formData: FormData) {
    setError(null)
    setSuccess(null)
    const result = await addProjectMember(projectId, formData)
    if (result?.error) setError(result.error)
    else if (result?.success) setSuccess(result.success as string)
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Remove ${email} from this project?`)) return
    setError(null)
    const result = await removeProjectMember(projectId, userId)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        {members.length === 0 && (
          <p className="text-sm text-neutral-500">No additional members. Add someone below.</p>
        )}
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <UserCircle className="w-5 h-5 text-neutral-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{member.email}</span>
                    {member.pending && (
                      <Badge variant="secondary" className="text-xs">Invite pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    Added {new Date(member.added_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(member.id, member.email)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input
                name="email"
                type="email"
                placeholder="analyst@example.com"
                required
              />
              <p className="text-xs text-neutral-500">
                If they don&apos;t have an account yet, an invite will be sent automatically.
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit">Add to Project</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
