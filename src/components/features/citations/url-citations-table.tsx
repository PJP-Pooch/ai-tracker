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
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline truncate max-w-xs"
          >
            {row.original.title || row.original.url}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <span className="text-xs text-neutral-400">{row.original.domain}</span>
        </div>
      ),
    },
    {
      accessorKey: 'citation_count',
      header: 'Citations',
      cell: ({ getValue }) => (
        <span className="font-semibold text-neutral-900">{(getValue() as number).toLocaleString()}</span>
      ),
      size: 80,
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-neutral-50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    <button className="flex items-center gap-1 hover:text-neutral-900" onClick={header.column.getToggleSortingHandler()}>
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
                <TableCell colSpan={columns.length} className="text-center py-8 text-neutral-400">
                  No URL citation data yet.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-neutral-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-neutral-500">{data.length} URLs</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </>
  )
}
