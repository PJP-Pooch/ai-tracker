'use client'

import { useState } from 'react'
import { createPrompt, deletePrompt, bulkCreatePrompts } from '@/actions/prompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Upload } from 'lucide-react'
import { TemplateBuilder } from '@/components/features/prompts/template-builder'
import type { Database } from '@/lib/supabase/types'

type Prompt = Database['public']['Tables']['prompts']['Row']

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
  low: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
}

const intentColors: Record<string, string> = {
  informational: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50',
  commercial: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50',
  transactional: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
}

export function PromptsTab({
  prompts,
  projectId,
  isAdmin,
}: {
  prompts: Prompt[]
  projectId: string
  isAdmin: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [priority, setPriority] = useState('medium')
  const [intent, setIntent] = useState('informational')

  async function handleCreate(formData: FormData) {
    formData.set('priority', priority)
    formData.set('intent', intent)
    const result = await createPrompt(projectId, formData)
    if (result?.error) setError(result.error)
  }

  async function handleBulk() {
    const result = await bulkCreatePrompts(projectId, bulkText)
    if (result?.error) {
      setError(result.error)
    } else {
      setBulkText('')
      setBulkOpen(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this prompt?')) return
    await deletePrompt(id, projectId)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm truncate font-medium text-foreground/90">{prompt.prompt_text}</span>
                <div className="flex gap-1.5 shrink-0 ml-2">
                  <Badge className={priorityColors[prompt.priority]} variant="outline">
                    {prompt.priority}
                  </Badge>
                  <Badge className={intentColors[prompt.intent ?? 'informational']} variant="outline">
                    {prompt.intent ?? 'informational'}
                  </Badge>
                  {!prompt.is_active && (
                    <Badge variant="outline" className="text-neutral-400">Paused</Badge>
                  )}
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(prompt.id)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {prompts.length === 0 && (
          <p className="text-sm text-neutral-500 py-4">No prompts yet. Add some below to start tracking.</p>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Add Prompts</CardTitle>
            <div className="flex gap-2">
              <TemplateBuilder projectId={projectId} />
              <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogTrigger render={
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Import Prompts</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500">Paste one prompt per line.</p>
                    <Textarea
                      rows={10}
                      placeholder="best dog food UK&#10;best dog food for sensitive stomachs&#10;gut health dog food"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                    />
                    <Button onClick={handleBulk} className="w-full">Import Prompts</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Input name="prompt_text" placeholder="best dog food UK" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => { if (v) setPriority(v) }}>
                    <SelectTrigger>
                      <SelectValue>
                        {priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Intent</Label>
                  <Select value={intent} onValueChange={(v) => { if (v) setIntent(v) }}>
                    <SelectTrigger>
                      <SelectValue>
                        {intent === 'informational' ? 'Informational' : intent === 'commercial' ? 'Commercial' : 'Transactional'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informational">Informational</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="gradient-indigo">Add Prompt</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
