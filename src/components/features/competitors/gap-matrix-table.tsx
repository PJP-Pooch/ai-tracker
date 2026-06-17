'use client'

import { useState, Fragment } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { GapMatrixRow, CompetitorGapStatus } from '@/lib/queries/competitors'
import { Check, MessageSquare, X, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface GapMatrixTableProps {
  data: GapMatrixRow[]
  competitorNames: string[]
  ownBrandName: string
}

export function GapMatrixTable({ data, competitorNames, ownBrandName }: GapMatrixTableProps) {
  const [activePlatform, setActivePlatform] = useState<'chatgpt' | 'gemini'>('chatgpt')
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const allPlatformBrands = [ownBrandName, ...competitorNames]
  const isGpt = activePlatform === 'chatgpt'

  // Group by category
  const groupedData = data.reduce((acc, row) => {
    const cat = row.category && row.category.trim() !== '' ? row.category.trim() : 'Uncategorized'
    if (!acc[cat]) {
      acc[cat] = []
    }
    acc[cat].push(row)
    return acc
  }, {} as Record<string, GapMatrixRow[]>)

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-foreground">Competitor Visibility Gap Matrix</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Detailed prompt-by-prompt mapping comparing brand vs. competitor citation and mention status.
          </p>
        </div>
        <Tabs
          value={activePlatform}
          onValueChange={(val) => setActivePlatform(val as 'chatgpt' | 'gemini')}
          className="w-fit"
        >
          <TabsList className="h-9">
            <TabsTrigger value="chatgpt" className="px-4 text-xs font-semibold">
              ChatGPT
            </TabsTrigger>
            <TabsTrigger value="gemini" className="px-4 text-xs font-semibold">
              Gemini
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-bold uppercase w-1/3">Prompt</TableHead>
              <TableHead className="text-xs font-bold uppercase w-32">Intent</TableHead>

              {/* Brands */}
              {allPlatformBrands.map((name, idx) => (
                <TableHead
                  key={`${activePlatform}-${name}`}
                  className={cn(
                    "text-xs font-bold text-center capitalize py-3 px-2 min-w-28",
                    idx === 0
                      ? isGpt
                        ? "border-l border-border/80 font-black text-indigo-700 bg-indigo-50/10 dark:text-indigo-400 dark:bg-indigo-950/10"
                        : "border-l border-border/80 font-black text-emerald-700 bg-emerald-50/10 dark:text-emerald-400 dark:bg-emerald-950/10"
                      : "text-muted-foreground"
                  )}
                >
                  {name === ownBrandName ? '✨ You' : name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3 + competitorNames.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  No tracking data available. Ensure you have active prompts and completed runs.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedData).map(([category, prompts]) => {
                const isCollapsed = !!collapsedCategories[category]

                return (
                  <Fragment key={category}>
                    {/* Collapsible Category Header Row */}
                    <TableRow
                      className="bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors border-y border-border/60"
                      onClick={() => toggleCategory(category)}
                    >
                      <TableCell
                        colSpan={3 + competitorNames.length}
                        className="py-2.5 px-4 font-bold text-xs text-foreground uppercase tracking-wider select-none"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span>{category}</span>
                          <Badge variant="secondary" className="ml-1.5 font-normal text-[10px] px-1.5 py-0.5">
                            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Prompts under this category */}
                    {!isCollapsed &&
                      prompts.map((row) => (
                        <TableRow key={row.promptId} className="hover:bg-muted/10">
                          <TableCell className="font-medium text-sm text-foreground/90 whitespace-normal break-words py-3 min-w-[280px]">
                            {row.promptText}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider',
                                row.intent === 'transactional'
                                  ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                                  : row.intent === 'commercial'
                                    ? 'bg-purple-100/50 text-purple-700 border-purple-200'
                                    : 'bg-sky-100/50 text-sky-700 border-sky-200'
                              )}
                            >
                              {row.intent}
                            </Badge>
                          </TableCell>

                          {/* Platforms cells */}
                          {allPlatformBrands.map((name, idx) => {
                            const platformData = isGpt ? row.chatgpt : row.gemini
                            const status = getPlatformBrandStatus(platformData, name, ownBrandName)
                            return (
                              <TableCell
                                key={`val-${activePlatform}-${name}`}
                                className={cn(
                                  "py-3 px-2 text-center",
                                  idx === 0
                                    ? isGpt
                                      ? "border-l border-border/40 bg-indigo-50/5 dark:bg-indigo-950/5"
                                      : "border-l border-border/40 bg-emerald-50/5 dark:bg-emerald-950/5"
                                    : ""
                                )}
                              >
                                <StatusIndicator status={status} />
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend footer */}
      <div className="p-4 bg-muted/40 border-t border-border/60 flex flex-wrap gap-x-6 gap-y-2 justify-end text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-emerald-100/60 border border-emerald-300 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
          </span>
          Cited in references (Best)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-blue-100/60 border border-blue-300 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
          </span>
          Mentioned in response text only
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-red-100/60 border border-red-300 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-red-700" />
          </span>
          Not referenced / missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
          </span>
          No platform run data yet
        </span>
      </div>
    </div>
  )
}

function getPlatformBrandStatus(
  platformData: { own: CompetitorGapStatus; competitors: CompetitorGapStatus[] } | null,
  brandName: string,
  ownBrandName: string
): 'cited' | 'mentioned' | 'missing' | 'none' {
  if (!platformData) return 'none'

  if (brandName === ownBrandName) {
    if (platformData.own.cited) return 'cited'
    if (platformData.own.mentioned) return 'mentioned'
    return 'missing'
  }

  const comp = platformData.competitors.find((c) => c.name === brandName)
  if (!comp) return 'missing'

  if (comp.cited) return 'cited'
  if (comp.mentioned) return 'mentioned'
  return 'missing'
}

function StatusIndicator({ status }: { status: 'cited' | 'mentioned' | 'missing' | 'none' }) {
  switch (status) {
    case 'cited':
      return (
        <span className="inline-flex w-7 h-7 rounded-lg bg-emerald-100/60 border border-emerald-300 items-center justify-center shadow-xs">
          <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
        </span>
      )
    case 'mentioned':
      return (
        <span className="inline-flex w-7 h-7 rounded-lg bg-blue-100/60 border border-blue-300 items-center justify-center shadow-xs">
          <MessageSquare className="w-4 h-4 text-blue-700 stroke-[2.5]" />
        </span>
      )
    case 'missing':
      return (
        <span className="inline-flex w-7 h-7 rounded-lg bg-red-100/60 border border-red-300 items-center justify-center shadow-xs">
          <X className="w-4 h-4 text-red-700 stroke-[3]" />
        </span>
      )
    case 'none':
    default:
      return (
        <span className="inline-flex w-7 h-7 rounded-lg bg-muted border border-border items-center justify-center opacity-40">
          <HelpCircle className="w-4 h-4 text-muted-foreground/40" />
        </span>
      )
  }
}
