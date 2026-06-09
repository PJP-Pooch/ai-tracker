'use client'

import { useState } from 'react'
import { createBrand, deleteBrand } from '@/actions/brands'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Brand = Database['public']['Tables']['brands']['Row']

export function BrandsTab({
  brands,
  projectId,
  isAdmin,
}: {
  brands: Brand[]
  projectId: string
  isAdmin: boolean
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createBrand(projectId, formData)
    if (result?.error) setError(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand?')) return
    await deleteBrand(id, projectId)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        {brands.map((brand) => (
          <Card key={brand.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <span className="font-medium">{brand.name}</span>
                <span className="text-sm text-neutral-500 ml-2">{brand.domain}</span>
                {brand.is_primary && <Badge className="ml-2" variant="secondary">Primary</Badge>}
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(brand.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input name="name" placeholder="Pooch & Mutt" required />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input name="domain" placeholder="poochandmutt.com" required />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_primary" value="true" id="is_primary" />
                <Label htmlFor="is_primary">This is my primary brand</Label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit">Add Brand</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
