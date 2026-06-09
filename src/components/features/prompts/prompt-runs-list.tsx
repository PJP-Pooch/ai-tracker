'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PositionCell } from './position-cell'
import { SentimentBadge } from './sentiment-badge'
import { ResponseDialog } from './response-dialog'
import type { RunHistory, PromptTableRow } from '@/lib/queries/prompts'

interface PromptRunsListProps {
  runs: RunHistory[]
  brandId: string | null
  trackedBrandNames: string[]
  prompt: {
    id: string
    prompt_text: string
    priority: string | null
    volume: number | null
    intent: string | null
  }
  projectId: string
}

export function PromptRunsList({ runs, brandId, trackedBrandNames, prompt, projectId }: PromptRunsListProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const chatgptRuns = runs.filter((r) => r.platform === 'chatgpt')
  const geminiRuns = runs.filter((r) => r.platform === 'gemini')

  // Map the prompt structure to the PromptTableRow shape for the dialog
  const promptTableRow: PromptTableRow = {
    id: prompt.id,
    promptText: prompt.prompt_text,
    priority: (prompt.priority as 'low' | 'medium' | 'high') || 'medium',
    volume: prompt.volume || 0,
    isActive: true,
    intent: (prompt.intent as 'informational' | 'commercial' | 'transactional') || 'informational',
    chatgpt_position: null,
    chatgpt_mentioned: false,
    chatgpt_sentiment: null,
    chatgpt_mention_type: null,
    gemini_position: null,
    gemini_mentioned: false,
    gemini_sentiment: null,
    gemini_mention_type: null,
    citationCount: 0,
    lastRunDate: null,
  }

  const handleRunClick = (dateString: string) => {
    setSelectedDate(dateString.split('T')[0])
    setDialogOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { label: 'ChatGPT', runs: chatgptRuns },
          { label: 'Gemini', runs: geminiRuns },
        ].map(({ label, runs: platformRuns }) => (
          <Card key={label} className="border border-border/85 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{label} — Last 30 Days</CardTitle>
              <p className="text-xs text-muted-foreground">Click a row to view the full response & sources</p>
            </CardHeader>
            <CardContent>
              {platformRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No runs yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                  {platformRuns.map((run) => {
                    const primaryMention = run.mentions
                      .filter((m) => m.brand_id === brandId && m.mentioned)
                      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0]

                    return (
                      <div
                        key={run.id}
                        onClick={() => handleRunClick(run.run_date)}
                        className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border/40 hover:bg-muted/40 hover:border-border/80 transition-all cursor-pointer group"
                      >
                        <span className="text-xs font-medium text-muted-foreground w-24 shrink-0 group-hover:text-foreground transition-colors">
                          {new Date(run.run_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <PositionCell
                            position={primaryMention?.position ?? null}
                            mentioned={!!primaryMention}
                          />
                          <SentimentBadge
                            sentiment={
                              primaryMention?.sentiment as
                                | 'positive'
                                | 'neutral'
                                | 'negative'
                                | null
                            }
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">
                          {run.citations.length} source{run.citations.length !== 1 ? 's' : ''} →
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ResponseDialog
        prompt={promptTableRow}
        runs={runs}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trackedBrandNames={trackedBrandNames}
        initialDate={selectedDate}
        projectId={projectId}
      />
    </>
  )
}
