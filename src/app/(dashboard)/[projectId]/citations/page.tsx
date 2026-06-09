import { getTopCitedDomains, getTopCitedUrls, getCitationOverlap } from '@/lib/queries/citations'
import { DomainCitationsTable } from '@/components/features/citations/domain-citations-table'
import { UrlCitationsTable } from '@/components/features/citations/url-citations-table'
import { CitationOverlapChart } from '@/components/features/citations/citation-overlap-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function CitationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const [domains, urls, overlap] = await Promise.all([
    getTopCitedDomains(projectId),
    getTopCitedUrls(projectId),
    getCitationOverlap(projectId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Citation Intelligence</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Discover which websites influence AI recommendations
        </p>
      </div>

      <CitationOverlapChart data={overlap} />

      <Tabs defaultValue="domains" className="mt-6">
        <TabsList>
          <TabsTrigger value="domains">Top Domains ({domains.length})</TabsTrigger>
          <TabsTrigger value="urls">Top URLs ({urls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="mt-4">
          <DomainCitationsTable data={domains} />
        </TabsContent>

        <TabsContent value="urls" className="mt-4">
          <UrlCitationsTable data={urls} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
