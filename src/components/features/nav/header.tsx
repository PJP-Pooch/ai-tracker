import { RunNowButton } from '@/components/features/prompts/run-now-button'
import { TimeframeFilter } from '@/components/features/shared/timeframe-filter'
import { formatLastScanned } from '@/lib/utils'
import { Suspense } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  projectId?: string
  lastScanned?: string | null
}

export function Header({ title, subtitle, projectId, lastScanned }: HeaderProps) {
  const formattedLastScanned = formatLastScanned(lastScanned)

  return (
    <header className="shrink-0 h-14 border-b border-border bg-background/80 backdrop-blur-sm px-6 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {projectId && (
          <Suspense fallback={<div className="w-40 h-8.5 bg-muted rounded-lg animate-pulse" />}>
            <TimeframeFilter />
          </Suspense>
        )}
        {formattedLastScanned && (
          <div className="hidden sm:inline-flex items-center text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1">
            Last scanned: <span className="ml-1 font-medium text-foreground">{formattedLastScanned}</span>
          </div>
        )}
        {projectId && (
          <RunNowButton projectId={projectId} />
        )}
      </div>
    </header>
  )
}


