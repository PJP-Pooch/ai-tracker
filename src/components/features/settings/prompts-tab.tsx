'use client'

import { useState } from 'react'
import { createPrompt, deletePrompt, bulkCreatePrompts, updatePrompt } from '@/actions/prompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Upload, Edit3 } from 'lucide-react'
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

function EditPromptDialog({ prompt, categories, projectId }: { prompt: Prompt; categories: string[]; projectId: string }) {
  const [open, setOpen] = useState(false)
  const [priority, setPriority] = useState(prompt.priority)
  const [intent, setIntent] = useState(prompt.intent ?? 'informational')
  const [category, setCategory] = useState(prompt.category ?? '')
  const [isCritique, setIsCritique] = useState(prompt.is_critique ?? false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdate(formData: FormData) {
    formData.set('priority', priority)
    formData.set('intent', intent)
    formData.set('category', category)
    formData.set('is_active', formData.get('is_active') === 'on' ? 'true' : 'false')
    formData.set('is_critique', isCritique ? 'true' : 'false')

    const result = await updatePrompt(prompt.id, projectId, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setError(null)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2">
          <Edit3 className="w-4 h-4" />
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
        </DialogHeader>
        <form action={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Prompt Text</Label>
            <Input name="prompt_text" defaultValue={prompt.prompt_text} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. dog food, brand"
              list={`edit-categories-${prompt.id}`}
            />
            <datalist id={`edit-categories-${prompt.id}`}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => { if (v) setPriority(v as any) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority">
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
              <Select value={intent} onValueChange={(v) => { if (v) setIntent(v as any) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Intent">
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

          <div className="space-y-2">
            <Label>Search Volume</Label>
            <Input name="volume" type="number" defaultValue={prompt.volume ?? 0} />
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              name="is_active"
              id={`edit-active-${prompt.id}`}
              defaultChecked={prompt.is_active}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <Label htmlFor={`edit-active-${prompt.id}`} className="cursor-pointer text-sm font-medium">Active / Tracked</Label>
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id={`edit-critique-${prompt.id}`}
              checked={isCritique}
              onChange={(e) => setIsCritique(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <Label htmlFor={`edit-critique-${prompt.id}`} className="cursor-pointer text-sm font-medium">Brand Critique Prompt</Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full gradient-indigo mt-2">Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
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
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [priority, setPriority] = useState('medium')
  const [intent, setIntent] = useState('informational')
  const [isCritique, setIsCritique] = useState(false)

  const categories = Array.from(
    new Set(prompts.map((p) => p.category).filter(Boolean))
  ) as string[]

  async function handleCreate(formData: FormData) {
    formData.set('priority', priority)
    formData.set('intent', intent)
    formData.set('is_critique', isCritique ? 'true' : 'false')
    const result = await createPrompt(projectId, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setError(null)
      setIsCritique(false)
      const form = document.querySelector('form')
      if (form) form.reset()
    }
  }

  async function handleBulk() {
    const result = await bulkCreatePrompts(projectId, bulkText, bulkCategory)
    if (result?.error) {
      setError(result.error)
    } else {
      setError(null)
      setBulkText('')
      setBulkCategory('')
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
                  {prompt.category && (
                    <Badge variant="secondary" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50">
                      {prompt.category}
                    </Badge>
                  )}
                  <Badge className={priorityColors[prompt.priority]} variant="outline">
                    {prompt.priority}
                  </Badge>
                  <Badge className={intentColors[prompt.intent ?? 'informational']} variant="outline">
                    {prompt.intent ?? 'informational'}
                  </Badge>
                  {prompt.is_branded && (
                    <Badge variant="outline" className="bg-orange-100/60 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50">
                      Branded
                    </Badge>
                  )}
                  {prompt.is_critique && (
                    <Badge variant="outline" className="bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                      Critique
                    </Badge>
                  )}
                  {!prompt.is_active && (
                    <Badge variant="outline" className="text-neutral-400">Paused</Badge>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <EditPromptDialog prompt={prompt} categories={categories} projectId={projectId} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(prompt.id)}
                    className="text-red-500 hover:text-red-700 px-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
                    <div className="space-y-1.5">
                      <Label>Assign to Category (Optional)</Label>
                      <Input
                        placeholder="e.g. dog food, dog treats"
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        list="bulk-categories"
                      />
                      <datalist id="bulk-categories">
                        {categories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
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
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Input
                  name="category"
                  placeholder="e.g. dog food, brand"
                  list="add-categories"
                />
                <datalist id="add-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
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
              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="add-critique"
                  checked={isCritique}
                  onChange={(e) => setIsCritique(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <Label htmlFor="add-critique" className="cursor-pointer text-sm font-medium">Brand Critique Prompt</Label>
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
