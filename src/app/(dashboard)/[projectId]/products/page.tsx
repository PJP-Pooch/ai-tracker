import { getProjectScrapedProducts } from '@/lib/queries/products'
import { ScrapedProductsView } from '@/components/features/products/scraped-products-view'
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

  return <ScrapedProductsView initialProducts={products} />
}
