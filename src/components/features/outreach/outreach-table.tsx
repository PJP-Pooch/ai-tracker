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
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Copy, Link2, Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface OutreachTableProps {
  data: OutreachOpportunity[]
}

export function OutreachTable({ data }: OutreachTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  function toggleRow(domain: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }))
  }

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
      'Prompt',
      'Recommendation URL',
    ]
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return ''
      const stringVal = String(val)
      return `"${stringVal.replace(/"/g, '""')}"`
    }
    
    const csvRows = [
      headers.join(','),
      ...rowsToExport.flatMap((row) => {
        if (!row.prompts || row.prompts.length === 0) {
          return [
            [
              escapeCSV(row.domain),
              row.competitorCitations,
              escapeCSV(row.competitorsCited),
              '',
              '',
            ].join(',')
          ]
        }
        return row.prompts.map((p) => [
          escapeCSV(row.domain),
          row.competitorCitations,
          escapeCSV(row.competitorsCited),
          escapeCSV(p.promptText),
          escapeCSV(p.url),
        ].join(','))
      }),
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
      cell: ({ row }) => {
        const domain = row.original.domain
        const isExpanded = !!expandedRows[domain]
        return (
          <span className="font-semibold text-foreground/90 flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0 transition-transform" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 transition-transform" />
            )}
            <Link2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            {domain}
          </span>
        )
      },
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
              <Badge key={b} variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 text-[10px] py-0 px-1.5 font-medium">
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
              table.getRowModel().rows.flatMap((row) => {
                const domain = row.original.domain
                const isExpanded = !!expandedRows[domain]
                
                const mainRow = (
                  <TableRow 
                    key={row.id} 
                    className={cn(
                      "hover:bg-muted/30 cursor-pointer transition-colors select-none",
                      isExpanded && "bg-muted/20 hover:bg-muted/20"
                    )}
                    onClick={() => toggleRow(domain)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
                
                if (!isExpanded) {
                  return [mainRow]
                }
                
                const detailRow = (
                  <TableRow key={`${row.id}-details`} className="bg-muted/5 border-t-0 hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="p-4 bg-muted/5">
                      <div className="space-y-3 pl-6 pr-4 py-2 border-l-2 border-primary/20">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                          Prompts Found For {domain}
                        </h4>
                        <div className="divide-y divide-border rounded-lg border bg-background overflow-hidden">
                          {row.original.prompts.map((p, idx) => (
                            <div key={idx} className="p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                              <div className="space-y-1 max-w-xl text-left">
                                <span className="font-medium text-foreground whitespace-normal break-words block">{p.promptText}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={p.url}>
                                  {p.url}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(p.url)
                                  }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-2.5 shrink-0"
                                >
                                  <Link2 className="w-3 h-3 mr-1" />
                                  Visit
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
                
                return [mainRow, detailRow]
              })
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
