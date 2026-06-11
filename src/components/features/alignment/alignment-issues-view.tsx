'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { AlignmentIssue, AlignmentSummary } from '@/lib/queries/alignment-issues'
import type { AlignmentClaim } from '@/lib/openai/brand-alignment'

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

function ClaimDetail({ claim }: { claim: AlignmentClaim }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
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
            <blockquote className="text-xs italic text-muted-foreground border-l-2 border-rose-300 dark:border-rose-700 pl-2">
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
  const contradictionCount = issue.contradicted_claims.length

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
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {contradictionCount} contradiction{contradictionCount !== 1 ? 's' : ''} detected
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${projectId}/prompts/${issue.prompt_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              View prompt
            </Link>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3 animate-in fade-in duration-150">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Contradicted Claims
          </p>
          {issue.contradicted_claims.map((claim, i) => (
            <ClaimDetail key={i} claim={claim} />
          ))}
        </div>
      )}
    </div>
  )
}

type Filter = 'all' | 'contradicted' | 'mixed' | 'chatgpt' | 'gemini'

interface AlignmentIssuesViewProps {
  issues: AlignmentIssue[]
  summary: AlignmentSummary
  projectId: string
}

export function AlignmentIssuesView({ issues, summary, projectId }: AlignmentIssuesViewProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = issues.filter((i) => {
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

  if (summary.total_issues === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">No issues found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            No contradictions have been detected yet. Run alignment checks from the Prompt Tracking page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No issues match this filter.</p>
        ) : (
          filtered.map((issue) => (
            <IssueRow key={issue.alignment_id} issue={issue} projectId={projectId} />
          ))
        )}
      </div>
    </div>
  )
}
