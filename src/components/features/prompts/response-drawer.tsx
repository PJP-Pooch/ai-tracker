'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PositionCell } from './position-cell'
import { SentimentBadge } from './sentiment-badge'
import type { RunHistory } from '@/lib/queries/prompts'
import type { PromptTableRow } from '@/lib/queries/prompts'

interface ResponseDrawerProps {
  prompt: PromptTableRow
  runs: RunHistory[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ResponseContent({ run }: { run: RunHistory | undefined }) {
  if (!run) {
    return (
      <div className="text-sm text-neutral-400 py-8 text-center">
        No data available for this platform yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-neutral-400">
        {new Date(run.run_date).toLocaleString()} · {run.platform}
      </div>

      {run.mentions.filter((m) => m.mentioned).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {run.mentions
            .filter((m) => m.mentioned)
            .map((m, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs">
                <PositionCell position={m.position} mentioned={m.mentioned} />
                <SentimentBadge sentiment={m.sentiment as 'positive' | 'neutral' | 'negative' | null} />
              </span>
            ))}
        </div>
      )}

      {run.raw_response && (
        <div className="prose prose-sm max-w-none text-sm text-neutral-700 bg-neutral-50 rounded-lg p-4 max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-xs">
          {run.raw_response}
        </div>
      )}

      {run.citations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Citations ({run.citations.length})
          </h4>
          <div className="space-y-1.5">
            {run.citations.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-neutral-400 w-4 shrink-0 mt-0.5">{c.position}</span>
                <div className="min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline truncate block"
                  >
                    {c.title || c.domain}
                  </a>
                  <span className="text-xs text-neutral-400">{c.domain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResponseDrawer({ prompt, runs, open, onOpenChange }: ResponseDrawerProps) {
  const latestChatGPT = runs.find((r) => r.platform === 'chatgpt')
  const latestGemini = runs.find((r) => r.platform === 'gemini')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">{prompt.promptText}</SheetTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{prompt.priority} priority</Badge>
            {prompt.volume > 0 && (
              <Badge variant="outline">{prompt.volume.toLocaleString()} searches/mo</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="chatgpt">
          <TabsList className="mb-4">
            <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="compare">Side-by-Side</TabsTrigger>
          </TabsList>

          <TabsContent value="chatgpt">
            <ResponseContent run={latestChatGPT} />
          </TabsContent>

          <TabsContent value="gemini">
            <ResponseContent run={latestGemini} />
          </TabsContent>

          <TabsContent value="compare">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  ChatGPT
                </h3>
                <ResponseContent run={latestChatGPT} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  Gemini
                </h3>
                <ResponseContent run={latestGemini} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
