'use client'

import { useState } from 'react'
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
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptsTableProps {
  data: PromptTableRow[]
  projectId: string
  trackedBrandNames?: string[]
}

export function PromptsTable({ data, projectId, trackedBrandNames = [] }: PromptsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTableRow | null>(null)
  const [dialogRuns, setDialogRuns] = useState<RunHistory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

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
        <button
          onClick={() => openDialog(row.original)}
          className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {row.original.promptText}
        </button>
      ),
      size: 300,
    },
    {
      accessorKey: 'intent',
      header: 'Intent',
      cell: ({ getValue }) => {
        const intent = getValue() as string
        return (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider',
              intent === 'transactional'
                ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200'
                : intent === 'commercial'
                  ? 'bg-purple-100/60 text-purple-700 border-purple-200'
                  : 'bg-sky-100/60 text-sky-700 border-sky-200'
            )}
          >
            {intent ?? 'informational'}
          </Badge>
        )
      },
      size: 110,
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
    initialState: { pagination: { pageSize: 25 } },
  })

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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  No prompts found. Add prompts in Settings to start tracking.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => openDialog(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} prompts
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
        />
      )}
    </>
  )
}
