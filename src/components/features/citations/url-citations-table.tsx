'use client'

import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ChevronsUpDown, ExternalLink } from 'lucide-react'
import type { CitedUrl } from '@/lib/queries/citations'

interface UrlCitationsTableProps {
  data: CitedUrl[]
}

export function UrlCitationsTable({ data }: UrlCitationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'citation_count', desc: true }])

  const columns: ColumnDef<CitedUrl>[] = [
    {
      id: 'url',
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <div className="min-w-0">
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-xs"
          >
            {row.original.title || row.original.url}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <span className="text-xs text-muted-foreground/70">{row.original.domain}</span>
        </div>
      ),
    },
    {
      accessorKey: 'citation_count',
      header: 'Citations',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{(getValue() as number).toLocaleString()}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'last_seen',
      header: 'Last Seen',
      cell: ({ getValue }) => {
        const val = getValue() as string
        if (!val) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <span className="text-sm text-foreground/80">
            {new Date(val).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )
      },
      size: 120,
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="text-sm text-foreground/80">
          {row.original.brand_name
            ? `Your Brand`
            : row.original.competitor_name
              ? `${row.original.competitor_name}`
              : 'Third Party'}
        </span>
      ),
      size: 120,
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
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? <ChevronUp className="w-3 h-3" /> :
                        header.column.getIsSorted() === 'desc' ? <ChevronDown className="w-3 h-3" /> :
                        <ChevronsUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No URL citation data yet.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isOwn = !!row.original.brand_name
                const isCompetitor = !!row.original.competitor_name
                const rowClass = isOwn
                  ? 'bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.12]'
                  : isCompetitor
                    ? 'bg-purple-500/[0.04] dark:bg-purple-500/[0.08] hover:bg-purple-500/[0.08] dark:hover:bg-purple-500/[0.12]'
                    : 'hover:bg-muted/30'

                return (
                  <TableRow key={row.id} className={rowClass}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-muted-foreground">{data.length} URLs</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </>
  )
}
