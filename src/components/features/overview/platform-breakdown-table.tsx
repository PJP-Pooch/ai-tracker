import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { PlatformBreakdownRow } from '@/lib/queries/overview'

const platformLabel: Record<string, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
}

interface PlatformBreakdownTableProps {
  data: PlatformBreakdownRow[]
}

export function PlatformBreakdownTable({ data }: PlatformBreakdownTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Visibility</TableHead>
              <TableHead className="text-right">Mention Rate</TableHead>
              <TableHead className="text-right">Avg Position</TableHead>
              <TableHead className="text-right">Citations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-neutral-400 text-sm py-8">
                  No platform data yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.platform}>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {platformLabel[row.platform] ?? row.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.visibilityScore}</TableCell>
                  <TableCell className="text-right">{row.mentionRate}%</TableCell>
                  <TableCell className="text-right">
                    {row.avgPosition !== null ? row.avgPosition : '—'}
                  </TableCell>
                  <TableCell className="text-right">{row.citationCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
