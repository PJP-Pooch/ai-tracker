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
import { ResponseDrawer } from './response-drawer'
import type { PromptTableRow } from '@/lib/queries/prompts'
import type { RunHistory } from '@/lib/queries/prompts'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

const priorityColors: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-neutral-500 bg-neutral-100',
}

interface PromptsTableProps {
  data: PromptTableRow[]
  projectId: string
}

export function PromptsTable({ data, projectId }: PromptsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTableRow | null>(null)
  const [drawerRuns, setDrawerRuns] = useState<RunHistory[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function openDrawer(prompt: PromptTableRow) {
    setSelectedPrompt(prompt)
    setDrawerOpen(true)
    // Fetch run history on demand
    const res = await fetch(`/api/prompt-runs/${prompt.id}`)
    if (res.ok) {
      const runs = await res.json() as RunHistory[]
      setDrawerRuns(runs)
    }
  }

  const columns: ColumnDef<PromptTableRow>[] = [
    {
      accessorKey: 'promptText',
      header: 'Prompt',
      cell: ({ row }) => (
        <button
          onClick={() => openDrawer(row.original)}
          className="text-left text-sm font-medium text-neutral-900 hover:text-indigo-600 transition-colors"
        >
          {row.original.promptText}
        </button>
      ),
      size: 320,
    },
    {
      accessorKey: 'volume',
      header: 'AI Volume',
      cell: ({ getValue }) => {
        const v = getValue() as number
        return v > 0 ? (
          <span className="text-sm text-neutral-600">{v.toLocaleString()}</span>
        ) : (
          <span className="text-neutral-300">—</span>
        )
      },
      size: 80,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => {
        const p = getValue() as string
        return (
          <Badge variant="outline" className={`text-xs ${priorityColors[p] ?? ''}`}>
            {p}
          </Badge>
        )
      },
      size: 80,
    },
    {
      id: 'chatgpt_position',
      accessorKey: 'chatgpt_position',
      header: 'ChatGPT Position',
      cell: ({ row }) => (
        <PositionCell
          position={row.original.chatgpt_position}
          mentioned={row.original.chatgpt_mentioned}
        />
      ),
      size: 80,
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
        />
      ),
      size: 80,
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
        <span className="text-sm text-neutral-600">{getValue() as number}</span>
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-neutral-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs font-semibold text-neutral-500 uppercase tracking-wide"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
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
                <TableCell colSpan={columns.length} className="text-center py-12 text-neutral-400">
                  No prompts found. Add prompts in Settings to start tracking.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => openDrawer(row.original)}
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
        <p className="text-sm text-neutral-500">
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
        <ResponseDrawer
          prompt={selectedPrompt}
          runs={drawerRuns}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  )
}
