'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
    is_branded?: boolean | null
  }
  projectId: string
}

export function PromptRunsList({ runs, brandId, trackedBrandNames, prompt, projectId }: PromptRunsListProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [chatgptExpanded, setChatgptExpanded] = useState(false)
  const [geminiExpanded, setGeminiExpanded] = useState(false)

  const chatgptRuns = runs.filter((r) => r.platform === 'chatgpt')
  const chatgptScraperRuns = runs.filter((r) => r.platform === 'chatgpt_scraper')
  const geminiRuns = runs.filter((r) => r.platform === 'gemini')
  const geminiScraperRuns = runs.filter((r) => r.platform === 'gemini_scraper')

  // Map the prompt structure to the PromptTableRow shape for the dialog
  const promptTableRow: PromptTableRow = {
    id: prompt.id,
    promptText: prompt.prompt_text,
    priority: (prompt.priority as 'low' | 'medium' | 'high') || 'medium',
    volume: prompt.volume || 0,
    isActive: true,
    isBranded: prompt.is_branded ?? false,
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
    setSelectedDate(dateString)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* ChatGPT Collapsible Section */}
      <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm">
        <button
          onClick={() => setChatgptExpanded(!chatgptExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors border-b border-border/60 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">ChatGPT Platforms</h2>
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-full font-medium">
              {chatgptRuns.length + chatgptScraperRuns.length} runs
            </span>
          </div>
          {chatgptExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {chatgptExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { label: 'ChatGPT', runs: chatgptRuns },
                { label: 'ChatGPT Scraper', runs: chatgptScraperRuns },
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
                              className="flex flex-col gap-2 py-2.5 px-3 rounded-lg border border-border/40 hover:bg-muted/40 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              {/* Top row: Date & Citations Count */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                  {new Date(run.run_date).toLocaleString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span className="text-muted-foreground group-hover:text-indigo-600 font-medium transition-colors shrink-0 flex items-center gap-0.5">
                                  {run.citations.length} source{run.citations.length !== 1 ? 's' : ''} &rarr;
                                </span>
                              </div>

                              {/* Bottom row: Mention status with Position and Sentiment Badges */}
                              <div className="flex items-center gap-2 h-7">
                                {primaryMention ? (
                                  <>
                                    <PositionCell
                                      position={primaryMention.position ?? null}
                                      mentioned={true}
                                    />
                                    <SentimentBadge
                                      sentiment={
                                        primaryMention.sentiment as
                                          | 'positive'
                                          | 'neutral'
                                          | 'negative'
                                          | null
                                      }
                                    />
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground/50 italic font-normal">
                                    Not mentioned
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gemini Collapsible Section */}
      <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm">
        <button
          onClick={() => setGeminiExpanded(!geminiExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors border-b border-border/60 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Gemini Platforms</h2>
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-full font-medium">
              {geminiRuns.length + geminiScraperRuns.length} runs
            </span>
          </div>
          {geminiExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {geminiExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { label: 'Gemini', runs: geminiRuns },
                { label: 'Gemini Scraper', runs: geminiScraperRuns },
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
                              className="flex flex-col gap-2 py-2.5 px-3 rounded-lg border border-border/40 hover:bg-muted/40 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              {/* Top row: Date & Citations Count */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                  {new Date(run.run_date).toLocaleString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span className="text-muted-foreground group-hover:text-indigo-600 font-medium transition-colors shrink-0 flex items-center gap-0.5">
                                  {run.citations.length} source{run.citations.length !== 1 ? 's' : ''} &rarr;
                                </span>
                              </div>

                              {/* Bottom row: Mention status with Position and Sentiment Badges */}
                              <div className="flex items-center gap-2 h-7">
                                {primaryMention ? (
                                  <>
                                    <PositionCell
                                      position={primaryMention.position ?? null}
                                      mentioned={true}
                                    />
                                    <SentimentBadge
                                      sentiment={
                                        primaryMention.sentiment as
                                          | 'positive'
                                          | 'neutral'
                                          | 'negative'
                                          | null
                                      }
                                    />
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground/50 italic font-normal">
                                    Not mentioned
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
    </div>
  )
}
