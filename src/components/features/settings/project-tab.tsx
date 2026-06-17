'use client'

import { useState } from 'react'
import { updateProject, deleteProject } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row']

// DataForSEO location codes + language codes per market
// https://docs.dataforseo.com/v3/serp/google/locations/
const MARKETS = [
  // English-speaking
  { label: '🇺🇸 United States', locationCode: 2840, languageCode: 'en' },
  { label: '🇬🇧 United Kingdom', locationCode: 2826, languageCode: 'en' },
  { label: '🇨🇦 Canada', locationCode: 2124, languageCode: 'en' },
  { label: '🇦🇺 Australia', locationCode: 2036, languageCode: 'en' },
  // European
  { label: '🇩🇪 Germany', locationCode: 2276, languageCode: 'de' },
  { label: '🇫🇷 France', locationCode: 2250, languageCode: 'fr' },
  { label: '🇳🇱 Netherlands', locationCode: 2528, languageCode: 'nl' },
  { label: '🇪🇸 Spain', locationCode: 2724, languageCode: 'es' },
  { label: '🇮🇹 Italy', locationCode: 2380, languageCode: 'it' },
  { label: '🇸🇪 Sweden', locationCode: 2752, languageCode: 'sv' },
  { label: '🇩🇰 Denmark', locationCode: 2208, languageCode: 'da' },
  { label: '🇳🇴 Norway', locationCode: 2578, languageCode: 'no' },
  { label: '🇫🇮 Finland', locationCode: 2246, languageCode: 'fi' },
  { label: '🇵🇱 Poland', locationCode: 2616, languageCode: 'pl' },
  { label: '🇧🇪 Belgium (EN)', locationCode: 2056, languageCode: 'en' },
  { label: '🇨🇭 Switzerland (EN)', locationCode: 2756, languageCode: 'en' },
]

function marketKey(locationCode: number, languageCode: string) {
  return JSON.stringify({ locationCode, languageCode })
}

export function ProjectTab({ project, isAdmin }: { project: Project; isAdmin: boolean }) {
  const [name, setName] = useState(project.name ?? '')
  const [platforms, setPlatforms] = useState<string[]>(project.platforms ?? ['chatgpt', 'gemini'])
  const [schedule, setSchedule] = useState<string>(project.schedule_frequency ?? 'four_times_daily')
  const [market, setMarket] = useState<string>(
    marketKey(
      project.target_location_code ?? 2840,
      project.target_language_code ?? 'en'
    )
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleUpdate(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('schedule_frequency', schedule)
    formData.set('market', market)
    formData.delete('platforms')
    platforms.forEach((p) => formData.append('platforms', p))

    const result = await updateProject(project.id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this project and all its data? This cannot be undone.')) return
    const result = await deleteProject(project.id)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Configure name, target market, search schedule, and LLM platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>

              {/* Target Market */}
              <div className="space-y-2">
                <Label>Target Market</Label>
                <Select value={market} onValueChange={(v) => { if (v) setMarket(v) }} disabled={!isAdmin}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETS.map((m) => (
                      <SelectItem key={marketKey(m.locationCode, m.languageCode)} value={marketKey(m.locationCode, m.languageCode)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sets the location and language for all AI and SERP queries run under this project.
                </p>
              </div>

              {/* Target Platforms */}
              <div className="space-y-2">
                <Label>Tracked LLM Platforms</Label>
                <div className="flex flex-wrap gap-4 mt-1">
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('chatgpt')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'chatgpt'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'chatgpt'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>ChatGPT</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('gemini')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'gemini'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'gemini'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>Gemini</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('chatgpt_scraper')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'chatgpt_scraper'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'chatgpt_scraper'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>ChatGPT Scraper</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors w-full sm:w-auto min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={platforms.includes('gemini_scraper')}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlatforms([...platforms, 'gemini_scraper'])
                        } else {
                          setPlatforms(platforms.filter((p) => p !== 'gemini_scraper'))
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>Gemini Scraper</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which AI models to query and track visibility metrics for.
                </p>
              </div>

              {/* Scan Schedule */}
              <div className="space-y-2">
                <Label>Scan Schedule</Label>
                <Select value={schedule} onValueChange={(v) => { if (v) setSchedule(v) }} disabled={!isAdmin}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="four_times_daily">4x Daily (Every 4 hours from 8 AM UTC)</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily (8 AM &amp; 8 PM UTC)</SelectItem>
                    <SelectItem value="daily">Daily (8 AM UTC)</SelectItem>
                    <SelectItem value="weekly">Weekly (Monday 8 AM UTC)</SelectItem>
                    <SelectItem value="paused">Paused (Manual run only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define how frequently queries should run automatically. All runs on the same day are aggregated and blended in visibility scores.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Settings saved successfully!</p>}
            {isAdmin && <Button type="submit">Save Changes</Button>}
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Permanently delete this project and all its data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
