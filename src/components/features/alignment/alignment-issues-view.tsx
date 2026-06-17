'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { XCircle, CheckCircle2, HelpCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react'
import type { AlignmentIssue, AlignmentSummary, AlignmentTopics, AlignmentTopicClaim } from '@/lib/queries/alignment-issues'
import type { AlignmentClaim } from '@/lib/openai/brand-alignment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateDefaultCritiquePrompts } from '@/actions/prompts'
import { ResponseDialog } from '@/components/features/prompts/response-dialog'
import type { RunHistory } from '@/lib/queries/prompts'
import type { PromptTableRow } from '@/lib/queries/prompts'

const platformBadge: Record<string, string> = {
  chatgpt: 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
  gemini: 'bg-blue-100/60 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
}

const verdictBadge: Record<string, string> = {
  contradicted: 'bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
  mixed: 'bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

const claimStyles = {
  contradicted: {
    wrapper: 'border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
    quote: 'border-rose-300 dark:border-rose-700',
  },
  confirmed: {
    wrapper: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />,
    quote: 'border-emerald-300 dark:border-emerald-700',
  },
  not_found: {
    wrapper: 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20',
    icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
    quote: 'border-amber-300 dark:border-amber-700',
  },
} as const

function ClaimDetail({ claim }: { claim: AlignmentClaim }) {
  const [expanded, setExpanded] = useState(false)
  const style = claimStyles[claim.verdict] ?? claimStyles.not_found
  return (
    <div className={cn('rounded-lg border p-3 space-y-1.5', style.wrapper)}>
      <div className="flex items-start gap-2">
        {style.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{claim.ai_claim}</p>
          {claim.explanation && (
            <p className="text-xs text-muted-foreground mt-0.5">{claim.explanation}</p>
          )}
        </div>
        {(claim.source_url || claim.source_quote) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {expanded && (
        <div className="pl-5 space-y-1.5 animate-in fade-in duration-150">
          {claim.source_quote && (
            <blockquote className={cn('text-xs italic text-muted-foreground border-l-2 pl-2', style.quote)}>
              "{claim.source_quote}"
            </blockquote>
          )}
          {claim.source_url && (
            <a
              href={claim.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {claim.source_url}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function IssueRow({ issue, projectId }: { issue: AlignmentIssue; projectId: string }) {
  const [expanded, setExpanded] = useState(false)

  const confirmedClaims = issue.claims.filter((c) => c.verdict === 'confirmed')
  const notFoundClaims = issue.claims.filter((c) => c.verdict === 'not_found')
  const contradictedClaims = issue.claims.filter((c) => c.verdict === 'contradicted')

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0', verdictBadge[issue.overall_verdict])}>
                {issue.overall_verdict === 'contradicted' ? 'Contradicted' : 'Mixed'}
              </span>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider shrink-0', platformBadge[issue.platform])}>
                {issue.platform === 'chatgpt' ? 'ChatGPT' : 'Gemini'}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                {new Date(issue.run_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{issue.prompt_text}</p>
            {/* Verdict breakdown pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {confirmedClaims.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {confirmedClaims.length} confirmed
                </span>
              )}
              {notFoundClaims.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <HelpCircle className="w-3 h-3" />
                  {notFoundClaims.length} not found
                </span>
              )}
              {contradictedClaims.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  <XCircle className="w-3 h-3" />
                  {contradictedClaims.length} contradicted
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${projectId}/prompts/${issue.prompt_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              View prompt
            </Link>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3 animate-in fade-in duration-150">
          {confirmedClaims.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Confirmed by brand website
              </p>
              {confirmedClaims.map((claim, i) => (
                <ClaimDetail key={i} claim={claim} />
              ))}
            </div>
          )}
          {notFoundClaims.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Not addressed on brand website
              </p>
              {notFoundClaims.map((claim, i) => (
                <ClaimDetail key={i} claim={claim} />
              ))}
            </div>
          )}
          {contradictedClaims.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Contradicted by brand website
              </p>
              {contradictedClaims.map((claim, i) => (
                <ClaimDetail key={i} claim={claim} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CritiquePromptRow({
  prompt,
  onViewResponse
}: {
  prompt: PromptTableRow
  onViewResponse: (prompt: PromptTableRow) => void
}) {
  const getSentimentStyle = (sentiment: string | null, mentioned: boolean) => {
    if (!mentioned) return 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-500 dark:border-zinc-700/30'
    if (sentiment === 'negative') return 'bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
    if (sentiment === 'neutral') return 'bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
    return 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
  }

  const getSentimentLabel = (sentiment: string | null, mentioned: boolean) => {
    if (!mentioned) return 'Not Mentioned'
    if (sentiment === 'negative') return 'Negative Critique'
    if (sentiment === 'neutral') return 'Neutral Feedback'
    return 'Positive Mention'
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 hover:border-border transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              {prompt.category || 'Critique'}
            </span>
            {prompt.lastRunDate && (
              <span className="text-[10px] text-muted-foreground">
                Last run: {new Date(prompt.lastRunDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground leading-snug break-words pr-4">
            {prompt.promptText}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* ChatGPT sentiment */}
          <div className={cn(
            'inline-flex flex-col items-center px-3 py-1.5 rounded-lg border text-center min-w-[110px]',
            getSentimentStyle(prompt.chatgpt_sentiment, prompt.chatgpt_mentioned)
          )}>
            <span className="text-[9px] uppercase font-bold opacity-60">ChatGPT</span>
            <span className="text-xs font-bold mt-0.5">
              {getSentimentLabel(prompt.chatgpt_sentiment, prompt.chatgpt_mentioned)}
            </span>
          </div>

          {/* Gemini sentiment */}
          <div className={cn(
            'inline-flex flex-col items-center px-3 py-1.5 rounded-lg border text-center min-w-[110px]',
            getSentimentStyle(prompt.gemini_sentiment, prompt.gemini_mentioned)
          )}>
            <span className="text-[9px] uppercase font-bold opacity-60">Gemini</span>
            <span className="text-xs font-bold mt-0.5">
              {getSentimentLabel(prompt.gemini_sentiment, prompt.gemini_mentioned)}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewResponse(prompt)}
            className="text-xs h-9 font-medium"
          >
            View Responses
          </Button>
        </div>
      </div>
    </div>
  )
}

type Filter = 'all' | 'contradicted' | 'mixed' | 'chatgpt' | 'gemini'

function TopicClaimCard({ claim, onClick }: { claim: AlignmentTopicClaim; onClick: (claim: AlignmentTopicClaim) => void }) {
  const style = claimStyles[claim.verdict] ?? claimStyles.not_found

  return (
    <button
      onClick={() => onClick(claim)}
      className={cn('w-full text-left rounded-lg border p-3 space-y-1.5 transition-colors hover:brightness-95 dark:hover:brightness-110 cursor-pointer', style.wrapper)}
    >
      <div className="flex items-start gap-2">
        {style.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{claim.ai_claim}</p>
          {claim.explanation && (
            <p className="text-xs text-muted-foreground mt-0.5">{claim.explanation}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
              claim.platform === 'chatgpt'
                ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                : 'bg-blue-100/60 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
            )}>
              {claim.platform === 'chatgpt' ? 'ChatGPT' : 'Gemini'}
            </span>
            {claim.occurrences > 1 && (
              <span className="text-[9px] font-semibold text-muted-foreground">
                seen {claim.occurrences}×
              </span>
            )}
            <span className="text-[9px] text-muted-foreground/60 ml-auto">View response →</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function TopicColumn({
  title,
  claims,
  icon,
  headerClass,
  emptyText,
  onClaimClick,
}: {
  title: string
  claims: AlignmentTopicClaim[]
  icon: React.ReactNode
  headerClass: string
  emptyText: string
  onClaimClick: (claim: AlignmentTopicClaim) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? claims : claims.slice(0, 5)
  const remaining = claims.length - 5

  return (
    <div className="flex flex-col gap-3">
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', headerClass)}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-xs font-bold">{claims.length}</span>
      </div>
      {claims.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6 bg-muted/10 rounded-lg border border-dashed border-border/60">
          {emptyText}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((claim, i) => (
              <TopicClaimCard key={i} claim={claim} onClick={onClaimClick} />
            ))}
          </div>
          {remaining > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs font-semibold text-primary hover:underline text-left px-1"
            >
              View {remaining} more
            </button>
          )}
          {showAll && claims.length > 5 && (
            <button
              onClick={() => setShowAll(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground text-left px-1"
            >
              Show less
            </button>
          )}
        </>
      )}
    </div>
  )
}

interface AlignmentIssuesViewProps {
  issues: AlignmentIssue[]
  summary: AlignmentSummary
  topics?: AlignmentTopics
  projectId: string
  critiquePrompts?: PromptTableRow[]
  trackedBrandNames?: string[]
  alignmentCheckMode?: 'off' | 'manual' | 'auto'
}

export function AlignmentIssuesView({
  issues,
  summary,
  topics,
  projectId,
  critiquePrompts = [],
  trackedBrandNames = [],
  alignmentCheckMode = 'off'
}: AlignmentIssuesViewProps) {
  const [activeTab, setActiveTab] = useState('topics')
  const [filter, setFilter] = useState<Filter>('all')
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  // Response dialog state
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTableRow | null>(null)
  const [dialogRuns, setDialogRuns] = useState<RunHistory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<string>('')
  const [dialogHighlightText, setDialogHighlightText] = useState<string>('')

  async function onViewResponse(prompt: PromptTableRow) {
    setSelectedPrompt(prompt)
    setDialogInitialDate('')
    setDialogHighlightText('')
    setDialogOpen(true)
    const res = await fetch(`/api/prompt-runs/${prompt.id}`)
    if (res.ok) {
      const runs = await res.json() as RunHistory[]
      setDialogRuns(runs)
    }
  }

  async function onTopicClaimClick(claim: AlignmentTopicClaim) {
    const stub: PromptTableRow = {
      id: claim.prompt_id,
      promptText: claim.prompt_text,
      priority: 'medium',
      volume: 0,
      isActive: true,
      isBranded: true,
      isCritique: false,
      intent: 'informational',
      category: null,
      chatgpt_position: null,
      chatgpt_mentioned: false,
      chatgpt_sentiment: null,
      chatgpt_mention_type: null,
      gemini_position: null,
      gemini_mentioned: false,
      gemini_sentiment: null,
      gemini_mention_type: null,
      citationCount: 0,
      citationShare: null,
      avgPosition: null,
      webSearchPct: null,
      lastRunDate: claim.run_date,
    }
    setSelectedPrompt(stub)
    setDialogInitialDate(claim.run_date)
    setDialogHighlightText(claim.ai_claim)
    setDialogRuns([])
    setDialogOpen(true)
    const res = await fetch(`/api/prompt-runs/${claim.prompt_id}`)
    if (res.ok) {
      const runs = await res.json() as RunHistory[]
      setDialogRuns(runs)
    }
  }

  async function handleGenerateCritiques() {
    setGenerating(true)
    try {
      const res = await generateDefaultCritiquePrompts(projectId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Generated ${res.count} critique prompts!`)
        router.refresh()
      }
    } catch {
      toast.error('Failed to generate critique prompts.')
    } finally {
      setGenerating(false)
    }
  }

  const filteredIssues = issues.filter((i) => {
    if (filter === 'contradicted') return i.overall_verdict === 'contradicted'
    if (filter === 'mixed') return i.overall_verdict === 'mixed'
    if (filter === 'chatgpt') return i.platform === 'chatgpt'
    if (filter === 'gemini') return i.platform === 'gemini'
    return true
  })

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All Issues', count: summary.total_issues },
    { value: 'contradicted', label: 'Contradicted', count: summary.contradicted_count },
    { value: 'mixed', label: 'Mixed', count: summary.mixed_count },
    { value: 'chatgpt', label: 'ChatGPT', count: summary.chatgpt_issues },
    { value: 'gemini', label: 'Gemini', count: summary.gemini_issues },
  ]

  // Critique calculations
  const totalCritiquePrompts = critiquePrompts.length
  // Count prompts that have been executed at least once (have a lastRunDate)
  const totalCritiqueRuns = critiquePrompts.filter((p) => p.lastRunDate !== null).length
  let negativeCritiqueMentions = 0
  let neutralCritiqueMentions = 0
  let positiveCritiqueMentions = 0

  critiquePrompts.forEach((p) => {
    if (p.chatgpt_mentioned) {
      if (p.chatgpt_sentiment === 'negative') negativeCritiqueMentions++
      else if (p.chatgpt_sentiment === 'neutral') neutralCritiqueMentions++
      else if (p.chatgpt_sentiment === 'positive') positiveCritiqueMentions++
    }
    if (p.gemini_mentioned) {
      if (p.gemini_sentiment === 'negative') negativeCritiqueMentions++
      else if (p.gemini_sentiment === 'neutral') neutralCritiqueMentions++
      else if (p.gemini_sentiment === 'positive') positiveCritiqueMentions++
    }
  })

  const totalMentions = negativeCritiqueMentions + neutralCritiqueMentions + positiveCritiqueMentions
  const negativeRate = totalMentions > 0 ? Math.round((negativeCritiqueMentions / totalMentions) * 100) : 0
  const positiveRate = totalMentions > 0 ? Math.round((positiveCritiqueMentions / totalMentions) * 100) : 0

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="topics" className="rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5">
            Topics Review
            {topics && (topics.positive.length + topics.negative.length + topics.missing.length) > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded-full">
                {topics.positive.length + topics.negative.length + topics.missing.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contradictions" className="rounded-lg px-4 py-2 text-xs font-semibold">
            Contradictions
          </TabsTrigger>
          <TabsTrigger value="critiques" className="rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5">
            Brand Critiques
            {totalCritiquePrompts > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-full">
                {totalCritiquePrompts}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-6 mt-0">
          {!topics || (topics.positive.length + topics.negative.length + topics.missing.length) === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">No topics yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Run alignment checks on prompt responses to start building a picture of what AI says about your brand.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Positive
                  </p>
                  <p className="text-2xl font-bold text-foreground">{topics.positive.length}</p>
                  <p className="text-xs text-muted-foreground">AI claims confirmed by brand</p>
                </div>
                <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Improvements
                  </p>
                  <p className="text-2xl font-bold text-foreground">{topics.missing.length}</p>
                  <p className="text-xs text-muted-foreground">Topics AI raises, brand doesn&apos;t cover</p>
                </div>
                <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4 space-y-1">
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Negative
                  </p>
                  <p className="text-2xl font-bold text-foreground">{topics.negative.length}</p>
                  <p className="text-xs text-muted-foreground">AI claims that contradict brand</p>
                </div>
              </div>

              {/* Three columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <TopicColumn
                  title="Positive"
                  claims={topics.positive}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  headerClass="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                  emptyText="No confirmed claims yet."
                  onClaimClick={onTopicClaimClick}
                />
                <TopicColumn
                  title="Improvements"
                  claims={topics.missing}
                  icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  headerClass="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                  emptyText="No improvement areas found."
                  onClaimClick={onTopicClaimClick}
                />
                <TopicColumn
                  title="Negative"
                  claims={topics.negative}
                  icon={<XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                  headerClass="bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                  emptyText="No contradictions found."
                  onClaimClick={onTopicClaimClick}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="contradictions" className="space-y-6 mt-0">
          {summary.total_issues === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">No contradictions found</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  No contradictions have been detected yet. Run alignment checks from the Prompt Tracking page.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Issues" value={summary.total_issues} />
                <StatCard label="Contradicted" value={summary.contradicted_count} sub="direct contradictions" />
                <StatCard label="Mixed" value={summary.mixed_count} sub="partial mismatches" />
                <StatCard label="Affected Prompts" value={summary.affected_prompts} />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {filters.map(({ value, label, count }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      filter === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border/60 hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {label}
                    <span className={cn(
                      'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                      filter === value ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Issues list */}
              <div className="space-y-3">
                {filteredIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No issues match this filter.</p>
                ) : (
                  filteredIssues.map((issue) => (
                    <IssueRow key={issue.alignment_id} issue={issue} projectId={projectId} />
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="critiques" className="space-y-6 mt-0">
          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-xl p-4 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Why Critique Prompts?</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                By default, LLM responses are neutral or positive. To discover real areas of improvement, we track specialized prompts designed to trigger negative feedback, criticisms, or comparisons. These prompts are excluded from overall brand visibility and sentiment scores.
              </p>
            </div>
          </div>

          {totalCritiquePrompts === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-card border border-border/60 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">No Brand Critique Prompts Tracked</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Generate a recommended series of branded prompts to test how AI platforms critique your products and highlight weaknesses.
                </p>
              </div>
              <Button onClick={handleGenerateCritiques} disabled={generating} className="gradient-indigo">
                {generating ? 'Generating...' : 'Generate Critique Prompts'}
              </Button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Critique Prompts" value={totalCritiquePrompts} />
                <StatCard label="Active AI Runs" value={totalCritiqueRuns} />
                <StatCard label="Negative Critique Rate" value={negativeRate} sub={`${negativeCritiqueMentions} of ${totalMentions} mentions`} />
                <StatCard label="Positive Critique Rate" value={positiveRate} sub={`${positiveCritiqueMentions} of ${totalMentions} mentions`} />
              </div>

              {/* Critique Prompts List */}
              <div className="space-y-3">
                {critiquePrompts.map((p) => (
                  <CritiquePromptRow
                    key={p.id}
                    prompt={p}
                    onViewResponse={onViewResponse}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      {selectedPrompt && (
        <ResponseDialog
          prompt={selectedPrompt}
          runs={dialogRuns}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trackedBrandNames={trackedBrandNames}
          initialDate={dialogInitialDate}
          highlightText={dialogHighlightText}
          projectId={projectId}
          alignmentCheckMode={alignmentCheckMode}
        />
      )}
    </div>
  )
}
