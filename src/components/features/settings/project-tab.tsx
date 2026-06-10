'use client'

import { useState } from 'react'
import { updateProject, deleteProject } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row']

export function ProjectTab({ project, isAdmin }: { project: Project; isAdmin: boolean }) {
  const [name, setName] = useState(project.name ?? '')
  const [platforms, setPlatforms] = useState<string[]>(project.platforms ?? ['chatgpt', 'gemini'])
  const [schedule, setSchedule] = useState<string>(project.schedule_frequency ?? 'four_times_daily')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleUpdate(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('schedule_frequency', schedule)
    formData.delete('platforms')
    platforms.forEach((p) => formData.append('platforms', p))

    const result = await updateProject(project.id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this project and all its data? This cannot be undone.')) return
    const result = await deleteProject(project.id)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Configure name, search schedule frequency, and target LLM platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>

              {/* Target Platforms */}
              <div className="space-y-2">
                <Label>Tracked LLM Platforms</Label>
                <div className="flex flex-wrap gap-4 mt-1">
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('chatgpt')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'chatgpt'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'chatgpt'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>ChatGPT</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('gemini')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'gemini'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'gemini'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>Gemini</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which AI models to query and track visibility metrics for.
                </p>
              </div>

              {/* Scan Schedule */}
              <div className="space-y-2">
                <Label>Scan Schedule</Label>
                <Select value={schedule} onValueChange={(v) => { if (v) setSchedule(v) }} disabled={!isAdmin}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="four_times_daily">4x Daily (Every 4 hours from 8 AM UTC)</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily (8 AM & 8 PM UTC)</SelectItem>
                    <SelectItem value="daily">Daily (8 AM UTC)</SelectItem>
                    <SelectItem value="weekly">Weekly (Monday 8 AM UTC)</SelectItem>
                    <SelectItem value="paused">Paused (Manual run only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define how frequently queries should run automatically. All runs on the same day are aggregated and blended in visibility scores.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Settings saved successfully!</p>}
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
            <Button variant="destructive" onClick={handleDelete}>
              Delete Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
