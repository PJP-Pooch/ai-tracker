'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkCreatePromptsWithOptions } from '@/actions/prompts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TemplatePrompt {
  prompt_text: string
  intent: 'informational' | 'commercial' | 'transactional'
  selected: boolean
}

export function TemplateBuilder({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Inputs
  const [brandName, setBrandName] = useState('')
  const [nicheCategory, setNicheCategory] = useState('')
  const [competitors, setCompetitors] = useState('')

  // Generated state
  const [generatedPrompts, setGeneratedPrompts] = useState<TemplatePrompt[]>([])
  const [step, setStep] = useState<1 | 2>(1)

  function handleGenerate() {
    if (!brandName || !nicheCategory) {
      toast.error('Please fill in your Brand Name and Niche/Category')
      return
    }

    const categoryClean = nicheCategory.trim()
    const brandClean = brandName.trim()
    const competitorList = competitors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    const primaryCompetitor = competitorList[0] || 'competitors'

    const templates: TemplatePrompt[] = [
      // Informational (Awareness)
      {
        prompt_text: `What are the benefits of ${categoryClean}?`,
        intent: 'informational',
        selected: true,
      },
      {
        prompt_text: `How does ${categoryClean} compare to standard alternatives?`,
        intent: 'informational',
        selected: true,
      },
      {
        prompt_text: `Is ${categoryClean} recommended by experts?`,
        intent: 'informational',
        selected: true,
      },
      {
        prompt_text: `How is premium ${categoryClean} manufactured or prepared?`,
        intent: 'informational',
        selected: true,
      },

      // Commercial (Consideration)
      {
        prompt_text: `What are the best ${categoryClean} brands in the UK?`,
        intent: 'commercial',
        selected: true,
      },
      {
        prompt_text: `Who makes the highest rated ${categoryClean}?`,
        intent: 'commercial',
        selected: true,
      },
      {
        prompt_text: `Compare ${brandClean} vs ${competitorList.join(' vs ') || 'competitors'}`,
        intent: 'commercial',
        selected: true,
      },
      {
        prompt_text: `What is the healthiest ${categoryClean} brand available?`,
        intent: 'commercial',
        selected: true,
      },

      // Transactional (Decision)
      {
        prompt_text: `Where can I buy ${brandClean} online?`,
        intent: 'transactional',
        selected: true,
      },
      {
        prompt_text: `Is ${brandClean} worth the subscription cost?`,
        intent: 'transactional',
        selected: true,
      },
      {
        prompt_text: `Are there discount codes or trials for ${brandClean}?`,
        intent: 'transactional',
        selected: true,
      },
      {
        prompt_text: `Reviews and customer feedback for ${brandClean} ${categoryClean}`,
        intent: 'transactional',
        selected: true,
      },
    ]

    setGeneratedPrompts(templates)
    setStep(2)
  }

  async function handleImport() {
    const selected = generatedPrompts.filter((p) => p.selected)
    if (selected.length === 0) {
      toast.error('Please select at least one prompt to import')
      return
    }

    setLoading(true)
    try {
      const res = await bulkCreatePromptsWithOptions(projectId, selected)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully imported ${res.count} D2C prompts!`)
        router.refresh()
        handleReset()
      }
    } catch {
      toast.error('An error occurred during import')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setBrandName('')
    setNicheCategory('')
    setCompetitors('')
    setGeneratedPrompts([])
    setStep(1)
    setOpen(false)
  }

  function togglePrompt(index: number) {
    setGeneratedPrompts((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
    )
  }

  function toggleAll(intent: 'informational' | 'commercial' | 'transactional', val: boolean) {
    setGeneratedPrompts((prev) =>
      prev.map((p) => (p.intent === intent ? { ...p, selected: val } : p))
    )
  }

  const informational = generatedPrompts.filter((p) => p.intent === 'informational')
  const commercial = generatedPrompts.filter((p) => p.intent === 'commercial')
  const transactional = generatedPrompts.filter((p) => p.intent === 'transactional')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); setOpen(v) }}>
      <DialogTrigger render={
        <Button variant="outline" className="text-primary border-primary/30 hover:border-primary">
          <Sparkles className="w-4 h-4 mr-2 text-primary animate-pulse" />
          D2C Template Builder
        </Button>
      } />
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" />
            D2C Prompt Campaign Builder
          </DialogTitle>
          <DialogDescription>
            Instantly set up a funnel-aligned keyword tracking campaign following Ahrefs custom prompt tracking framework.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName" className="text-sm font-semibold">Your Brand Name</Label>
              <Input
                id="brandName"
                placeholder="e.g. Pooch & Mutt"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nicheCategory" className="text-sm font-semibold">Product Niche / Category</Label>
              <Input
                id="nicheCategory"
                placeholder="e.g. fresh dog food, organic cat food"
                value={nicheCategory}
                onChange={(e) => setNicheCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitors" className="text-sm font-semibold">Competitors (Comma separated)</Label>
              <Input
                id="competitors"
                placeholder="e.g. Butternut Box, Lily's Kitchen"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerate} className="w-full mt-2 gradient-indigo">
              Generate Funnel Prompts
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {/* Informational Section */}
              <div className="border rounded-xl p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-xs px-2 py-0.5">
                      Informational
                    </Badge>
                    <span className="text-xs text-muted-foreground">(Problem/Category Aware)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="select-all-info"
                      checked={informational.every((p) => p.selected)}
                      onChange={(e) => toggleAll('informational', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="select-all-info" className="text-[11px] text-muted-foreground select-none cursor-pointer">
                      Select All
                    </label>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {generatedPrompts.map((p, index) => {
                    if (p.intent !== 'informational') return null
                    return (
                      <div key={index} className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id={`p-${index}`}
                          checked={p.selected}
                          onChange={() => togglePrompt(index)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 shrink-0 cursor-pointer"
                        />
                        <label htmlFor={`p-${index}`} className="text-sm text-foreground/80 leading-snug cursor-pointer select-none">
                          {p.prompt_text}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Commercial Section */}
              <div className="border rounded-xl p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs px-2 py-0.5">
                      Commercial
                    </Badge>
                    <span className="text-xs text-muted-foreground">(Brand Consideration)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="select-all-comm"
                      checked={commercial.every((p) => p.selected)}
                      onChange={(e) => toggleAll('commercial', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="select-all-comm" className="text-[11px] text-muted-foreground select-none cursor-pointer">
                      Select All
                    </label>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {generatedPrompts.map((p, index) => {
                    if (p.intent !== 'commercial') return null
                    return (
                      <div key={index} className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id={`p-${index}`}
                          checked={p.selected}
                          onChange={() => togglePrompt(index)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 shrink-0 cursor-pointer"
                        />
                        <label htmlFor={`p-${index}`} className="text-sm text-foreground/80 leading-snug cursor-pointer select-none">
                          {p.prompt_text}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Transactional Section */}
              <div className="border rounded-xl p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2 py-0.5">
                      Transactional
                    </Badge>
                    <span className="text-xs text-muted-foreground">(Decision/Purchase)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="select-all-trans"
                      checked={transactional.every((p) => p.selected)}
                      onChange={(e) => toggleAll('transactional', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="select-all-trans" className="text-[11px] text-muted-foreground select-none cursor-pointer">
                      Select All
                    </label>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {generatedPrompts.map((p, index) => {
                    if (p.intent !== 'transactional') return null
                    return (
                      <div key={index} className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id={`p-${index}`}
                          checked={p.selected}
                          onChange={() => togglePrompt(index)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 shrink-0 cursor-pointer"
                        />
                        <label htmlFor={`p-${index}`} className="text-sm text-foreground/80 leading-snug cursor-pointer select-none">
                          {p.prompt_text}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleImport} disabled={loading} className="flex-1 gradient-indigo">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Selected Prompts'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
