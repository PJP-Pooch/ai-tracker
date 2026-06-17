'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, MinusCircle, Loader2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrandAlignmentResult } from '@/lib/queries/brand-alignment'
import type { AlignmentClaim, AlignmentVerdict } from '@/lib/openai/brand-alignment'

interface AlignmentPanelProps {
  runId: string | undefined
  checkMode: 'off' | 'manual' | 'auto'
}

const verdictConfig: Record<AlignmentVerdict, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50',
  },
  contradicted: {
    label: 'Contradicted',
    icon: XCircle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50',
  },
  not_found: {
    label: 'Not Found',
    icon: MinusCircle,
    color: 'text-zinc-500 dark:text-zinc-400',
    bg: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-700/50',
  },
}

function ClaimRow({ claim }: { claim: AlignmentClaim }) {
  const [expanded, setExpanded] = useState(false)
  const config = verdictConfig[claim.verdict]
  const Icon = config.icon

  return (
    <div className={cn('rounded-xl border p-3 space-y-2 transition-colors', config.bg)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{claim.ai_claim}</span>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider shrink-0', config.color)}>
              {config.label}
            </span>
          </div>
          {claim.explanation && (
            <p className="text-xs text-muted-foreground mt-0.5">{claim.explanation}</p>
          )}
        </div>
        {(claim.source_quote || claim.source_url) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="pl-6 space-y-2 animate-in fade-in duration-150">
          {claim.source_quote && (
            <blockquote className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
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

function OverallBadge({ verdict }: { verdict: BrandAlignmentResult['overall_verdict'] }) {
  if (!verdict) return null
  const map = {
    aligned: { label: 'Brand Aligned', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50' },
    contradicted: { label: 'Contradictions Found', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50' },
    mixed: { label: 'Partially Aligned', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' },
    unchecked: { label: 'Not Mentioned', color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
  }
  const cfg = map[verdict]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', cfg.color)}>
      {cfg.label}
    </span>
  )
}

export function AlignmentPanel({ runId, checkMode }: AlignmentPanelProps) {
  const [result, setResult] = useState<BrandAlignmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!runId || fetched) return
    setFetched(true)

    // Always fetch existing result first
    fetch(`/api/alignment/result?runId=${runId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: BrandAlignmentResult | null) => {
        if (data) {
          setResult(data)
        } else if (checkMode === 'auto') {
          // Auto mode: trigger check if no result exists
          triggerCheck()
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  async function triggerCheck() {
    if (!runId || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/alignment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      })
      const data = await res.json() as BrandAlignmentResult & { error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? 'Alignment check failed.')
      } else {
        // Re-fetch the full result
        const resultRes = await fetch(`/api/alignment/result?runId=${runId}`)
        if (resultRes.ok) setResult(await resultRes.json() as BrandAlignmentResult)
      }
    } catch {
      setError('Failed to run alignment check.')
    } finally {
      setLoading(false)
    }
  }

  if (!runId) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/60">
        No data available for this platform on this scan date.
      </div>
    )
  }

  if (loading || result?.status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Checking brand alignment&hellip;</p>
        <p className="text-xs">Searching your website and verifying claims via AI.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={triggerCheck}>Retry</Button>
      </div>
    )
  }

  if (!result || result.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <p className="text-sm text-muted-foreground max-w-xs">
          Run an alignment check to see whether this AI response accurately describes your brand.
        </p>
        <Button onClick={triggerCheck} disabled={loading}>
          Check Alignment
        </Button>
      </div>
    )
  }

  if (result.status === 'failed') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error_message ?? 'Alignment check failed.'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={triggerCheck}>Retry</Button>
      </div>
    )
  }

  const claims = (result.claims ?? []) as AlignmentClaim[]
  const contradictions = claims.filter((c) => c.verdict === 'contradicted').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OverallBadge verdict={result.overall_verdict} />
          {contradictions > 0 && (
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {contradictions} contradiction{contradictions > 1 ? 's' : ''} detected
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={triggerCheck} disabled={loading} className="h-7 text-xs text-muted-foreground">
          Re-check
        </Button>
      </div>

      {claims.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No specific brand claims were found in this response.
        </p>
      ) : (
        <div className="space-y-2">
          {claims.map((claim, i) => (
            <ClaimRow key={i} claim={claim} />
          ))}
        </div>
      )}

      {result.checked_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Checked {new Date(result.checked_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
