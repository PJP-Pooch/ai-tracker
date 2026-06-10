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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { OutreachOpportunity } from '@/lib/queries/outreach'
import { ChevronDown, ChevronUp, ChevronsUpDown, Copy, Link2, Search, Download } from 'lucide-react'
import { toast } from 'sonner'

interface OutreachTableProps {
  data: OutreachOpportunity[]
}

export function OutreachTable({ data }: OutreachTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied URL to clipboard!')
  }

  function handleExportCSV() {
    const rowsToExport = table.getFilteredRowModel().rows.map((row) => row.original)
    
    const headers = [
      'Outreach Target Domain',
      'Competitor Citations',
      'Brands Mentioned',
      'Triggering Prompts',
      'Sample Prompt',
      'Sample Recommendation URL',
    ]
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return ''
      const stringVal = String(val)
      return `"${stringVal.replace(/"/g, '""')}"`
    }
    
    const csvRows = [
      headers.join(','),
      ...rowsToExport.map((row) => [
        escapeCSV(row.domain),
        row.competitorCitations,
        escapeCSV(row.competitorsCited),
        row.promptsCount,
        escapeCSV(row.samplePrompt),
        escapeCSV(row.sampleUrl),
      ].join(',')),
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'outreach_opportunities.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns: ColumnDef<OutreachOpportunity>[] = [
    {
      accessorKey: 'domain',
      header: 'Outreach Target Domain',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground/90 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground/60" />
          {getValue() as string}
        </span>
      ),
      size: 250,
    },
    {
      accessorKey: 'competitorCitations',
      header: 'Competitor Citations',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">{getValue() as number} times</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'competitorsCited',
      header: 'Brands Mentioned',
      cell: ({ getValue }) => {
        const brands = (getValue() as string).split(',').map((b) => b.trim())
        return (
          <div className="flex flex-wrap gap-1">
            {brands.map((b) => (
              <Badge key={b} variant="outline" className="bg-red-500/5 text-red-600 border-red-500/10 text-[10px] py-0 px-1.5 font-medium">
                {b}
              </Badge>
            ))}
          </div>
        )
      },
      size: 220,
    },
    {
      accessorKey: 'promptsCount',
      header: 'Triggering Prompts',
      cell: ({ getValue }) => (
        <span className="text-sm text-foreground/80">{getValue() as number} queries</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'samplePrompt',
      header: 'Sample Prompt',
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate" title={getValue() as string}>
          <span className="text-xs text-muted-foreground">{getValue() as string || '-'}</span>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'sampleUrl',
      header: 'Sample Recommendation URL',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-sm">
          <span className="text-xs text-muted-foreground truncate" title={row.original.sampleUrl}>
            {row.original.sampleUrl}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => copyToClipboard(row.original.sampleUrl)}
            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      ),
      size: 250,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Search domains…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 shrink-0">
          <Download className="w-3.5 h-3.5" />
          Export to CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3"
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
                  No outreach opportunities found. Your competitors might not have citations, or you are already cited everywhere they are!
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} outreach targets
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
    </div>
  )
}
