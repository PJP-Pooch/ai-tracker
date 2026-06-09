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
  own: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  competitor: 'bg-amber-50 text-amber-700 border-amber-200',
  'third-party': 'bg-neutral-100 text-neutral-600 border-neutral-200',
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
            className="text-sm font-medium text-neutral-900 hover:text-indigo-600"
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
        <span className="font-semibold text-neutral-900">{(getValue() as number).toLocaleString()}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'run_count',
      header: 'Run Coverage',
      cell: ({ getValue }) => (
        <span className="text-sm text-neutral-600">{(getValue() as number)} runs</span>
      ),
      size: 100,
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-neutral-50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs font-semibold text-neutral-500 uppercase tracking-wide"
                  >
                    <button
                      className="flex items-center gap-1 hover:text-neutral-900"
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
                <TableCell colSpan={columns.length} className="text-center py-8 text-neutral-400">
                  No citation data yet. Run some prompts to populate this.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-neutral-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-neutral-500">{data.length} domains</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </>
  )
}
