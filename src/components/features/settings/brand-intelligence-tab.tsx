'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2 } from 'lucide-react'
import { saveBrandIntelligenceSettings, generateBrandBriefFromHomepage } from '@/actions/brand-alignment'

interface BrandIntelligenceTabProps {
  projectId: string
  initialPositioning: string | null
  initialCheckMode: 'off' | 'manual' | 'auto'
  isAdmin: boolean
  primaryBrandDomain: string | null
}

export function BrandIntelligenceTab({
  projectId,
  initialPositioning,
  initialCheckMode,
  isAdmin,
  primaryBrandDomain,
}: BrandIntelligenceTabProps) {
  const [positioning, setPositioning] = useState(initialPositioning ?? '')
  const [checkMode, setCheckMode] = useState<'off' | 'manual' | 'auto'>(initialCheckMode)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    const result = await generateBrandBriefFromHomepage(projectId)
    setGenerating(false)
    if (result.error) {
      setError(result.error)
    } else if (result.brief) {
      setPositioning(result.brief)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const result = await saveBrandIntelligenceSettings(projectId, positioning, checkMode)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Brand Positioning Brief</CardTitle>
          <CardDescription>
            Describe what your brand is, what it sells, and what it is not. This is used to detect
            when AI models describe your brand inaccurately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="positioning">Brand Brief</Label>
              {primaryBrandDomain && isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="h-7 text-xs gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {generating ? 'Generating...' : 'Generate from Homepage'}
                </Button>
              )}
            </div>
            <Textarea
              id="positioning"
              rows={6}
              placeholder="e.g. We are a functional dry dog food brand focused on gut health. We sell kibble and complementary wet food. We are NOT a raw food brand."
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              disabled={!isAdmin}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you are and are not. Include product category, key benefit, and any common misconceptions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alignment Check Mode</CardTitle>
          <CardDescription>
            Choose when to check AI responses against your brand brief.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={checkMode}
            onValueChange={(v) => { if (v) setCheckMode(v as 'off' | 'manual' | 'auto') }}
            disabled={!isAdmin}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off — never check</SelectItem>
              <SelectItem value="manual">Manual — check on demand per response</SelectItem>
              <SelectItem value="auto">Auto — check every new scan automatically</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Auto mode runs a check after each scan completes. Manual mode adds a "Check Alignment"
            button to each response in the prompt detail view.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">Settings saved.</p>}

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
