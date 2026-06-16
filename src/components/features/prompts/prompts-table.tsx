'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PositionCell } from './position-cell'
import { SentimentBadge } from './sentiment-badge'
import { ResponseDialog } from './response-dialog'
import type { PromptTableRow, RunHistory } from '@/lib/queries/prompts'
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptsTableProps {
  data: PromptTableRow[]
  projectId: string
  trackedBrandNames?: string[]
  alignmentCheckMode?: 'off' | 'manual' | 'auto'
}

export function PromptsTable({ data, projectId, trackedBrandNames = [], alignmentCheckMode = 'off' }: PromptsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTableRow | null>(null)
  const [dialogRuns, setDialogRuns] = useState<RunHistory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const searchParams = useSearchParams()
  const groupBy = searchParams.get('groupBy') ?? 'category'

  async function openDialog(prompt: PromptTableRow) {
    setSelectedPrompt(prompt)
    setDialogOpen(true)
    // Fetch run history on demand
    const res = await fetch(`/api/prompt-runs/${prompt.id}`)
    if (res.ok) {
      const runs = await res.json() as RunHistory[]
      setDialogRuns(runs)
    }
  }

  const columns: ColumnDef<PromptTableRow>[] = [
    {
      accessorKey: 'promptText',
      header: 'Prompt',
      cell: ({ row }) => (
        <Link
          href={`/${projectId}/prompts/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors block whitespace-normal break-words"
        >
          {row.original.promptText}
        </Link>
      ),
      size: 300,
    },
    {
      accessorKey: 'intent',
      header: 'Intent',
      cell: ({ row }) => {
        const intent = row.original.intent
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider',
                intent === 'transactional'
                  ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                  : intent === 'commercial'
                    ? 'bg-purple-100/60 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50'
                    : 'bg-sky-100/60 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50'
              )}
            >
              {intent ?? 'informational'}
            </Badge>
            {row.original.isBranded && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wider bg-orange-100/60 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50"
              >
                Branded
              </Badge>
            )}
          </div>
        )
      },
      size: 150,
    },

    {
      id: 'chatgpt_position',
      accessorKey: 'chatgpt_position',
      header: 'ChatGPT Position',
      cell: ({ row }) => (
        <PositionCell
          position={row.original.chatgpt_position}
          mentioned={row.original.chatgpt_mentioned}
          mentionType={row.original.chatgpt_mention_type}
        />
      ),
      size: 150,
    },
    {
      id: 'chatgpt_sentiment',
      accessorKey: 'chatgpt_sentiment',
      header: 'ChatGPT Sentiment',
      cell: ({ row }) => (
        <SentimentBadge sentiment={row.original.chatgpt_sentiment} />
      ),
      size: 120,
    },
    {
      id: 'gemini_position',
      accessorKey: 'gemini_position',
      header: 'Gemini Position',
      cell: ({ row }) => (
        <PositionCell
          position={row.original.gemini_position}
          mentioned={row.original.gemini_mentioned}
          mentionType={row.original.gemini_mention_type}
        />
      ),
      size: 150,
    },
    {
      id: 'gemini_sentiment',
      accessorKey: 'gemini_sentiment',
      header: 'Gemini Sentiment',
      cell: ({ row }) => (
        <SentimentBadge sentiment={row.original.gemini_sentiment} />
      ),
      size: 120,
    },
    {
      accessorKey: 'citationCount',
      header: 'Citations',
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground/80">{getValue() as number}</span>
      ),
      size: 70,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 50 } }, // show more rows when grouped
  })

  const rows = table.getRowModel().rows

  // Group rows by category for Category view
  const groupedRows: Record<string, typeof rows> = {}
  for (const r of rows) {
    const cat = r.original.category?.trim() || 'Uncategorized'
    if (!groupedRows[cat]) {
      groupedRows[cat] = []
    }
    groupedRows[cat].push(r)
  }

  const categoriesList = Object.keys(groupedRows).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  const isExpanded = (cat: string) => expandedCategories[cat] !== false
  const toggleExpand = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !isExpanded(cat) }))
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-30" />
                          )
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {groupBy === 'category' ? (
              categoriesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    No prompts found. Add prompts in Settings to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                categoriesList.map((cat) => {
                  const catRows = groupedRows[cat]
                  const total = catRows.length
                  const expanded = isExpanded(cat)

                  // Compute aggregates
                  const chatgptMentionedRows = catRows.filter((r) => r.original.chatgpt_mentioned)
                  const chatgptVis = total > 0 ? (chatgptMentionedRows.length / total) * 100 : 0
                  const chatgptAvgPos = chatgptMentionedRows.length > 0
                    ? chatgptMentionedRows.reduce((sum, r) => sum + (r.original.chatgpt_position ?? 0), 0) / chatgptMentionedRows.length
                    : null

                  const geminiMentionedRows = catRows.filter((r) => r.original.gemini_mentioned)
                  const geminiVis = total > 0 ? (geminiMentionedRows.length / total) * 100 : 0
                  const geminiAvgPos = geminiMentionedRows.length > 0
                    ? geminiMentionedRows.reduce((sum, r) => sum + (r.original.gemini_position ?? 0), 0) / geminiMentionedRows.length
                    : null

                  const citationSum = catRows.reduce((sum, r) => sum + r.original.citationCount, 0)

                  return (
                    <Fragment key={`cat-group-${cat}`}>
                      {/* Category Header Row */}
                      <TableRow
                        className="bg-muted/20 hover:bg-muted/30 font-semibold cursor-pointer border-b select-none group/cat"
                        onClick={() => toggleExpand(cat)}
                      >
                        {/* Prompt Name Cell */}
                        <TableCell className="py-4 px-4 font-bold text-foreground min-w-[280px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-muted-foreground shrink-0">
                                {expanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </span>
                              <span className="capitalize text-sm font-semibold">{cat}</span>
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-muted-foreground/10 text-muted-foreground border-none font-semibold uppercase tracking-wider">
                                {total} prompt{total !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {cat !== 'Uncategorized' && (
                              <Link
                                href={`/${projectId}/overview?category=${encodeURIComponent(cat)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover/cat:opacity-100 transition-opacity text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
                              >
                                Analyze <span className="text-[10px]">↗</span>
                              </Link>
                            )}
                          </div>
                        </TableCell>

                        {/* Intent Cell */}
                        <TableCell className="py-4 px-4 text-muted-foreground/40 text-xs">—</TableCell>

                        {/* ChatGPT Position */}
                        <TableCell className="py-4 px-4">
                          {chatgptAvgPos !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                                {chatgptAvgPos.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* ChatGPT Sentiment (rendered as Category Visibility Score) */}
                        <TableCell className="py-4 px-4">
                          <span className="text-sm font-bold text-foreground">
                            {chatgptVis.toFixed(0)}%
                          </span>
                        </TableCell>

                        {/* Gemini Position */}
                        <TableCell className="py-4 px-4">
                          {geminiAvgPos !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-400">
                                {geminiAvgPos.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Gemini Sentiment (rendered as Category Visibility Score) */}
                        <TableCell className="py-4 px-4">
                          <span className="text-sm font-bold text-foreground">
                            {geminiVis.toFixed(0)}%
                          </span>
                        </TableCell>

                        {/* Citations */}
                        <TableCell className="py-4 px-4">
                          <span className="text-sm text-foreground/80 font-bold">{citationSum}</span>
                        </TableCell>
                      </TableRow>

                      {/* Nested Prompt Rows */}
                      {expanded && catRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-muted/10 bg-background/50 border-b cursor-pointer"
                          onClick={() => openDialog(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const isPromptCell = cell.column.id === 'promptText'
                            return (
                              <TableCell
                                key={cell.id}
                                style={{ width: cell.column.getSize() }}
                                className={cn(
                                  isPromptCell ? 'whitespace-normal break-words py-3 min-w-[280px]' : undefined,
                                  "align-middle"
                                )}
                              >
                                {isPromptCell ? (
                                  <div className="flex items-center gap-2 pl-4 border-l border-muted-foreground/25 ml-2">
                                    <Link
                                      href={`/${projectId}/prompts/${row.original.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors block whitespace-normal break-words"
                                    >
                                      {row.original.promptText}
                                    </Link>
                                  </div>
                                ) : (
                                  flexRender(cell.column.columnDef.cell, cell.getContext())
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                })
              )
            ) : (
              rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    No prompts found. Add prompts in Settings to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => openDialog(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={cell.column.id === 'promptText' ? 'whitespace-normal break-words py-3.5 min-w-[280px]' : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {rows.length} prompts
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedPrompt && (
        <ResponseDialog
          prompt={selectedPrompt}
          runs={dialogRuns}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trackedBrandNames={trackedBrandNames}
          projectId={projectId}
          alignmentCheckMode={alignmentCheckMode}
        />
      )}
    </>
  )
}
