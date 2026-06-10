'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { CitedDomain } from '@/lib/queries/citations'

const ownerTagStyles: Record<string, string> = {
  own: 'bg-primary/10 text-primary border-primary/20',
  competitor: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  'third-party': 'bg-muted text-muted-foreground border-border',
}

interface DomainCitationsTableProps {
  data: CitedDomain[]
}

export function DomainCitationsTable({ data }: DomainCitationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'citation_count', desc: true }])

  const columns: ColumnDef<CitedDomain>[] = [
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${row.original.domain}&sz=16`}
            alt=""
            width={16}
            height={16}
            className="rounded-sm"
          />
          <a
            href={`https://${row.original.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {row.original.domain}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'citation_count',
      header: 'Citations',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{(getValue() as number).toLocaleString()}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'run_count',
      header: 'Run Coverage',
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground/80">{(getValue() as number)} runs</span>
      ),
      size: 100,
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
      id: 'ownerTag',
      accessorKey: 'ownerLabel',
      header: 'Owner',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs ${ownerTagStyles[row.original.ownerTag]}`}
        >
          {row.original.ownerLabel}
        </Badge>
      ),
      size: 160,
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
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
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
                  No citation data yet. Run some prompts to populate this.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const owner = row.original.ownerTag
                const rowClass = owner === 'own'
                  ? 'bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.12]'
                  : owner === 'competitor'
                    ? 'bg-purple-500/[0.04] dark:bg-purple-500/[0.08] hover:bg-purple-500/[0.08] dark:hover:bg-purple-500/[0.12]'
                    : 'hover:bg-muted/30'

                return (
                  <TableRow key={row.id} className={rowClass}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-muted-foreground">{data.length} domains</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </>
  )
}
