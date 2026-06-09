import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPromptRunHistory } from '@/lib/queries/prompts'
import { PositionCell } from '@/components/features/prompts/position-cell'
import { SentimentBadge } from '@/components/features/prompts/sentiment-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; promptId: string }>
}) {
  const { projectId, promptId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, prompt_text, priority, volume')
    .eq('id', promptId)
    .single()

  if (!prompt) redirect(`/${projectId}/prompts`)

  const runs = await getPromptRunHistory(promptId, 30)
  const chatgptRuns = runs.filter((r) => r.platform === 'chatgpt')
  const geminiRuns = runs.filter((r) => r.platform === 'gemini')

  return (
    <div>
      <Link
        href={`/${projectId}/prompts`}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Prompts
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">{prompt.prompt_text}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{prompt.priority} priority</Badge>
          {prompt.volume > 0 && (
            <Badge variant="outline">{prompt.volume.toLocaleString()} searches/mo</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { label: 'ChatGPT', runs: chatgptRuns },
          { label: 'Gemini', runs: geminiRuns },
        ].map(({ label, runs: platformRuns }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-base">{label} — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {platformRuns.length === 0 ? (
                <p className="text-sm text-neutral-400">No runs yet.</p>
              ) : (
                <div className="space-y-3">
                  {platformRuns.slice(0, 10).map((run) => {
                    const primaryMention = run.mentions
                      .filter((m) => m.mentioned)
                      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0]

                    return (
                      <div
                        key={run.id}
                        className="flex items-center gap-4 py-2 border-b last:border-0"
                      >
                        <span className="text-xs text-neutral-400 w-24 shrink-0">
                          {new Date(run.run_date).toLocaleDateString()}
                        </span>
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
                        <span className="text-xs text-neutral-400">
                          {run.citations.length} citations
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
    </div>
  )
}
