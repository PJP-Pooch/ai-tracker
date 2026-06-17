import { getProjectScrapedProducts } from '@/lib/queries/products'
import { ScrapedProductsView } from '@/components/features/products/scraped-products-view'
import { createDbClient } from '@/lib/supabase/db'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scraped Products | AI Tracker',
  description: 'View all product recommendations scraped from search engine outcomes.',
}

export default async function ScrapedProductsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const products = await getProjectScrapedProducts(projectId)

  const supabase = await createDbClient()
  const primaryBrand = await supabase
    .from('brands')
    .select('name')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .maybeSingle()
  const primaryBrandName = primaryBrand?.data?.name ?? 'Own Brand'

  return <ScrapedProductsView initialProducts={products} ownBrandName={primaryBrandName} />
}
