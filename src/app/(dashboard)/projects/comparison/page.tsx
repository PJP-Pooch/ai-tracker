'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { 
  AlertCircle, 
  ArrowRightLeft, 
  Bot, 
  Check, 
  Coins, 
  ExternalLink, 
  Info, 
  MapPin, 
  Megaphone, 
  Phone, 
  Play, 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Star, 
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Location options for DataForSEO
const LOCATIONS = [
  { name: 'United States', code: 2840, lang: 'English' },
  { name: 'United Kingdom', code: 2826, lang: 'English' },
  { name: 'Canada', code: 2124, lang: 'English' },
  { name: 'Australia', code: 2036, lang: 'English' },
  { name: 'Germany', code: 2276, lang: 'German' },
  { name: 'France', code: 2250, lang: 'French' },
]

export default function ComparisonPage() {
  const [keyword, setKeyword] = useState('best running shoes 2026')
  const [locationName, setLocationName] = useState('United States')
  const [languageName, setLanguageName] = useState('English')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [promptText, setPromptText] = useState('')
  const [isPromptEdited, setIsPromptEdited] = useState(false)
  
  // Running state
  const [isRunning, setIsRunning] = useState(false)

  // Collapsed sections
  const [chatgptExpanded, setChatgptExpanded] = useState(false)
  const [geminiExpanded, setGeminiExpanded] = useState(false)
  
  // ChatGPT Scraper results
  const [cgScraperLoading, setCgScraperLoading] = useState(false)
  const [cgScraperError, setCgScraperError] = useState<string | null>(null)
  const [cgScraperData, setCgScraperData] = useState<any | null>(null)
  
  // ChatGPT Responses API results
  const [cgResponsesLoading, setCgResponsesLoading] = useState(false)
  const [cgResponsesError, setCgResponsesError] = useState<string | null>(null)
  const [cgResponsesData, setCgResponsesData] = useState<any | null>(null)

  // Gemini Scraper results
  const [gemScraperLoading, setGemScraperLoading] = useState(false)
  const [gemScraperError, setGemScraperError] = useState<string | null>(null)
  const [gemScraperData, setGemScraperData] = useState<any | null>(null)
  
  // Gemini Responses API results
  const [gemResponsesLoading, setGemResponsesLoading] = useState(false)
  const [gemResponsesError, setGemResponsesError] = useState<string | null>(null)
  const [gemResponsesData, setGemResponsesData] = useState<any | null>(null)

  // Auto-generate prompt based on keyword
  useEffect(() => {
    if (!isPromptEdited) {
      setPromptText(`Search the web and tell me about: "${keyword}". Please recommend top brands, list key features, and summarize pros and cons.`)
    }
  }, [keyword, isPromptEdited])

  const handleRunComparison = async () => {
    if (!keyword.trim()) {
      toast.error('Please enter a keyword')
      return
    }

    setIsRunning(true)

    setCgScraperLoading(true)
    setCgResponsesLoading(true)
    setGemScraperLoading(true)
    setGemResponsesLoading(true)

    setCgScraperError(null)
    setCgResponsesError(null)
    setGemScraperError(null)
    setGemResponsesError(null)

    setCgScraperData(null)
    setCgResponsesData(null)
    setGemScraperData(null)
    setGemResponsesData(null)

    // 1. ChatGPT Scraper
    const runCgScraper = async () => {
      try {
        const res = await fetch('/api/compare/llm-scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            locationName,
            languageName,
            device,
            se: 'chat_gpt',
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch ChatGPT Scraper')
        setCgScraperData(data)
      } catch (err: any) {
        setCgScraperError(err.message || 'ChatGPT Scraper failed')
      } finally {
        setCgScraperLoading(false)
      }
    }

    // 2. ChatGPT Responses API
    const runCgResponses = async () => {
      try {
        const res = await fetch('/api/compare/llm-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText,
            platform: 'chat_gpt',
            modelName: 'gpt-4.1',
            webSearch: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch ChatGPT Responses')
        setCgResponsesData(data)
      } catch (err: any) {
        setCgResponsesError(err.message || 'ChatGPT Responses failed')
      } finally {
        setCgResponsesLoading(false)
      }
    }

    // 3. Gemini Scraper
    const runGemScraper = async () => {
      try {
        const res = await fetch('/api/compare/llm-scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            locationName,
            languageName,
            device,
            se: 'gemini',
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch Gemini Scraper')
        setGemScraperData(data)
      } catch (err: any) {
        setGemScraperError(err.message || 'Gemini Scraper failed')
      } finally {
        setGemScraperLoading(false)
      }
    }

    // 4. Gemini Responses API
    const runGemResponses = async () => {
      try {
        const res = await fetch('/api/compare/llm-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText,
            platform: 'gemini',
            modelName: 'gemini-3.1-pro-preview',
            webSearch: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch Gemini Responses')
        setGemResponsesData(data)
      } catch (err: any) {
        setGemResponsesError(err.message || 'Gemini Responses failed')
      } finally {
        setGemResponsesLoading(false)
      }
    }

    // Run all in parallel
    Promise.all([runCgScraper(), runCgResponses(), runGemScraper(), runGemResponses()]).then(() => {
      setIsRunning(false)
      toast.success('All comparative test runs completed!')
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-primary" />
            DataForSEO Comparison Tool
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Compare ChatGPT & Gemini LLM Scrapers vs standard Conversational LLM Responses APIs side-by-side.
          </p>
        </div>
      </div>

      {/* Control panel */}
      <Card className="border border-border/80 shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Comparison Configurations
          </CardTitle>
          <CardDescription>
            Specify parameters and compare ChatGPT and Gemini endpoints concurrently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Keyword Input */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="keyword">Target Keyword (LLM Scraper Search)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="keyword"
                  className="pl-9"
                  placeholder="e.g. best laptops 2026"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Location Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Location & Lang</Label>
              <Select
                value={locationName}
                onValueChange={(val) => {
                  if (val) {
                    setLocationName(val)
                    const loc = LOCATIONS.find(l => l.name === val)
                    if (loc) setLanguageName(loc.lang)
                  }
                }}
                disabled={isRunning}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.name} value={loc.name}>
                      {loc.name} ({loc.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="device">Device Type</Label>
              <Select
                value={device}
                onValueChange={(val: any) => {
                  if (val) setDevice(val)
                }}
                disabled={isRunning}
              >
                <SelectTrigger id="device">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">Desktop (Windows)</SelectItem>
                  <SelectItem value="mobile">Mobile (Android)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversational Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="promptText">Conversational Prompt (Responses API)</Label>
              {isPromptEdited && (
                <button
                  type="button"
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
                  onClick={() => setIsPromptEdited(false)}
                >
                  Reset to Auto-generated
                </button>
              )}
            </div>
            <Textarea
              id="promptText"
              rows={2}
              className="resize-none"
              placeholder="Enter custom prompt..."
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value)
                setIsPromptEdited(true)
              }}
              disabled={isRunning}
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5 inline text-indigo-500 shrink-0" />
              The Scraper handles keywords directly. The Responses API needs a full conversational instruction containing the keyword.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              className="w-full sm:w-auto font-medium gap-2 px-8 cursor-pointer relative overflow-hidden group shadow-md"
              disabled={isRunning}
              onClick={handleRunComparison}
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running Comparative Test Runs...' : 'Compare APIs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ChatGPT Comparison Collapsible Row */}
      <Card className="border border-border/80 shadow-md overflow-hidden bg-card/40">
        <button
          type="button"
          onClick={() => setChatgptExpanded(!chatgptExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">ChatGPT Comparison</CardTitle>
              <CardDescription className="text-xs">Compare OpenAI ChatGPT Responses API vs ChatGPT Scraper API</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cgScraperData && cgResponsesData && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60 hidden sm:inline-block">
                Duration: {cgScraperData.timeSec.toFixed(1)}s (Scraper) vs {cgResponsesData.timeSec.toFixed(1)}s (Responses)
              </span>
            )}
            {chatgptExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </button>
        {chatgptExpanded && (
          <div className="p-6 border-t border-border/40 bg-background/50">
            <ComparisonResultSection
              platformLabel="ChatGPT"
              responsesLoading={cgResponsesLoading}
              responsesError={cgResponsesError}
              responsesData={cgResponsesData}
              responsesCost={0.05}
              scraperLoading={cgScraperLoading}
              scraperError={cgScraperError}
              scraperData={cgScraperData}
              scraperCost={0.004}
              isRunning={isRunning}
            />
          </div>
        )}
      </Card>

      {/* Gemini Comparison Collapsible Row */}
      <Card className="border border-border/80 shadow-md overflow-hidden bg-card/40">
        <button
          type="button"
          onClick={() => setGeminiExpanded(!geminiExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Gemini Comparison</CardTitle>
              <CardDescription className="text-xs">Compare Google Gemini Responses API vs Gemini Scraper API</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gemScraperData && gemResponsesData && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60 hidden sm:inline-block">
                Duration: {gemScraperData.timeSec.toFixed(1)}s (Scraper) vs {gemResponsesData.timeSec.toFixed(1)}s (Responses)
              </span>
            )}
            {geminiExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </button>
        {geminiExpanded && (
          <div className="p-6 border-t border-border/40 bg-background/50">
            <ComparisonResultSection
              platformLabel="Gemini"
              responsesLoading={gemResponsesLoading}
              responsesError={gemResponsesError}
              responsesData={gemResponsesData}
              responsesCost={0.04}
              scraperLoading={gemScraperLoading}
              scraperError={gemScraperError}
              scraperData={gemScraperData}
              scraperCost={0.004}
              isRunning={isRunning}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

interface ComparisonResultSectionProps {
  platformLabel: string
  responsesLoading: boolean
  responsesError: string | null
  responsesData: any
  responsesCost: number
  scraperLoading: boolean
  scraperError: string | null
  scraperData: any
  scraperCost: number
  isRunning: boolean
}

function ComparisonResultSection({
  platformLabel,
  responsesLoading,
  responsesError,
  responsesData,
  responsesCost,
  scraperLoading,
  scraperError,
  scraperData,
  scraperCost,
  isRunning,
}: ComparisonResultSectionProps) {
  const savingsPercent = ((responsesCost - scraperCost) / responsesCost) * 100

  return (
    <div className="space-y-6">
      {/* Cost widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-indigo-500/30 bg-indigo-50/5 dark:bg-indigo-950/5">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-indigo-500">API Credit Cost</CardTitle>
            <Coins className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">${scraperCost.toFixed(3)}</span>
              <span className="text-[10px] text-muted-foreground">vs ${responsesCost.toFixed(3)} / responses run</span>
            </div>
            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
              <Check className="w-3.5 h-3.5" />
              Scraper is {savingsPercent.toFixed(0)}% cheaper!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Scraper Duration</CardTitle>
            <Timer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3">
            <div className="text-xl font-bold">
              {scraperLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : scraperData ? (
                `${scraperData.timeSec.toFixed(2)}s`
              ) : (
                '--'
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {scraperData ? `Engine: ${scraperData.model}` : 'Waiting for search run...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Responses Duration</CardTitle>
            <Timer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3">
            <div className="text-xl font-bold">
              {responsesLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : responsesData ? (
                `${responsesData.timeSec.toFixed(2)}s`
              ) : (
                '--'
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {responsesData ? `API Model: ${responsesData.modelName}` : 'Waiting for search run...'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Responses API */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-muted-foreground" />
              <h4 className="text-sm font-bold text-foreground">1. {platformLabel} Responses API</h4>
            </div>
            <Badge variant="outline">Live Endpoint (${responsesCost.toFixed(2)})</Badge>
          </div>

          {responsesLoading && (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          )}

          {responsesError && (
            <Card className="border-red-500/30 bg-red-50/10 dark:bg-red-950/10 p-6 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Responses Request Failed</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">{responsesError}</p>
              </div>
            </Card>
          )}

          {responsesData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Output Content */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-xs font-semibold">Response Content (Markdown)</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed dark:text-zinc-300">
                  <ReactMarkdown>{responsesData.content}</ReactMarkdown>
                </CardContent>
              </Card>

              {/* Citations Card */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span>Citations & References</span>
                    <Badge variant="secondary">{responsesData.annotations?.length ?? 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {(!responsesData.annotations || responsesData.annotations.length === 0) ? (
                    <p className="text-xs text-muted-foreground p-6 text-center">No references found.</p>
                  ) : (
                    <div className="divide-y divide-border text-xs">
                      {responsesData.annotations.map((ann: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                              {ann.title || 'Source Citation'}
                            </span>
                            <a
                              href={ann.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5 shrink-0"
                            >
                              Visit link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{ann.url}</p>
                          {ann.snippet && (
                            <p className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1 italic">
                              "{ann.snippet}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raw JSON Inspect */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Raw API Payload</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <details className="cursor-pointer group">
                    <summary className="px-6 py-3 text-xs text-indigo-500 hover:text-indigo-400 select-none">
                      Click to inspect raw JSON response
                    </summary>
                    <pre className="text-[10px] bg-zinc-900 text-zinc-100 p-4 overflow-x-auto select-text font-mono max-h-[300px]">
                      {JSON.stringify(responsesData, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            </div>
          )}

          {!isRunning && !responsesData && !responsesError && (
            <div className="border-2 border-dashed border-border p-12 text-center rounded-xl">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold">Ready to test Responses API</p>
              <p className="text-xs text-muted-foreground mt-1">Configure parameters above and compare.</p>
            </div>
          )}
        </div>

        {/* Right Side: LLM Scraper */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-bold text-foreground">2. {platformLabel} Scraper</h4>
            </div>
            <Badge variant="default" className="bg-indigo-500 text-white hover:bg-indigo-400">
              Scraper Endpoint (${scraperCost.toFixed(3)})
            </Badge>
          </div>

          {scraperLoading && (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          )}

          {scraperError && (
            <Card className="border-red-500/30 bg-red-50/10 dark:bg-red-950/10 p-6 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Scraper Request Failed</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">{scraperError}</p>
              </div>
            </Card>
          )}

          {scraperData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Output Content */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-xs font-semibold">Scraper Output Markdown</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed dark:text-zinc-300">
                  {scraperData.markdown ? (
                    <ReactMarkdown>{scraperData.markdown}</ReactMarkdown>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">No text content returned.</p>
                  )}
                </CardContent>
              </Card>

              {/* Ads Renders (Sponsors) */}
              <Card className="border-amber-500/20 bg-amber-50/5 dark:bg-amber-950/5">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-amber-500" />
                    Sponsored Search Ads
                  </CardTitle>
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 uppercase text-[9px]">
                    Scraper Exclusive
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {!scraperData.ads || scraperData.ads.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 text-center">No ads returned for this query.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {scraperData.ads.map((ad: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-foreground">{ad.title}</span>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] scale-90 origin-left">
                                  Sponsored
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{ad.domain}</p>
                            </div>
                            {ad.advertiser?.favicon_url && (
                              <img
                                src={ad.advertiser.favicon_url}
                                alt={ad.advertiser.name || 'Ad'}
                                className="w-5 h-5 rounded border bg-white shrink-0"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">{ad.snippet}</p>
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5"
                          >
                            Visit Advertiser ({ad.advertiser?.name || ad.domain}) <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products Renders */}
              <Card className="border-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    Shopping & Product Listings
                  </CardTitle>
                  <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-500/30 uppercase text-[9px]">
                    Scraper Exclusive
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  {!scraperData.products || scraperData.products.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No products returned for this query.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {scraperData.products.map((prod: any, idx: number) => (
                        <div key={idx} className="border border-border/80 bg-background rounded-lg p-3 space-y-2 hover:shadow-sm transition-all duration-150 flex flex-col justify-between">
                          <div className="space-y-2">
                            {prod.images?.[0] && (
                              <div className="aspect-square w-full rounded border overflow-hidden bg-white flex items-center justify-center p-1">
                                <img
                                  src={prod.images[0]}
                                  alt={prod.title}
                                  className="max-h-24 max-w-full object-contain"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                                />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-semibold leading-tight line-clamp-2 text-foreground">
                                {prod.title}
                              </h4>
                              <p className="text-[10px] text-muted-foreground truncate">{prod.domain}</p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {prod.currency === 'USD' ? '$' : ''}{prod.price} {prod.currency !== 'USD' ? prod.currency : ''}
                              </span>
                              {prod.rating != null && (
                                <span className="text-[10px] flex items-center gap-0.5 text-amber-500 font-medium">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                  {typeof prod.rating === 'object' && prod.rating !== null ? (
                                    <>
                                      {prod.rating.value}
                                      {prod.rating.votes_count && (
                                        <span className="text-muted-foreground text-[9px] font-normal ml-0.5">
                                          ({prod.rating.votes_count})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    (typeof prod.rating === 'string' || typeof prod.rating === 'number') ? prod.rating : null
                                  )}
                                </span>
                              )}
                            </div>
                            {prod.tag && (
                              <p className="text-[9px] text-muted-foreground italic truncate bg-muted px-1.5 py-0.5 rounded">
                                {prod.tag}
                              </p>
                            )}
                            <a
                              href={prod.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9.5px] text-indigo-500 hover:underline flex items-center justify-center gap-0.5 py-1 border border-indigo-500/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded w-full font-medium"
                            >
                              Shop Merchant <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Local Businesses Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Local Maps Businesses
                  </CardTitle>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 uppercase text-[9px]">
                    Scraper Exclusive
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {!scraperData.localBusinesses || scraperData.localBusinesses.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 text-center">No local businesses returned.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {scraperData.localBusinesses.map((biz: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-foreground">{biz.title}</h4>
                              {biz.rating && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-0.5 font-medium">
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    <span className="font-semibold ml-0.5">
                                      {typeof biz.rating === 'object' && biz.rating !== null ? biz.rating.value : ((typeof biz.rating === 'string' || typeof biz.rating === 'number') ? biz.rating : null)}
                                    </span>
                                  </div>
                                  {typeof biz.rating === 'object' && biz.rating !== null && (biz.rating.votes_count || biz.reviews_count) && (
                                    <span className="text-muted-foreground text-[9px] font-normal">
                                      ({biz.rating.votes_count || biz.reviews_count} reviews)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {biz.domain && (
                              <a
                                href={biz.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5"
                              >
                                Website <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {biz.description && (
                            <p className="text-xs text-muted-foreground leading-normal">{biz.description}</p>
                          )}

                          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pt-1">
                            {biz.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                {biz.address}
                              </span>
                            )}
                            {biz.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                {biz.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Brand Entities Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span>Extracted Brand Entities</span>
                    <Badge variant="secondary">{scraperData.brandEntities?.length ?? 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!scraperData.brandEntities || scraperData.brandEntities.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 text-center">No brands identified.</p>
                  ) : (
                    <div className="divide-y divide-border text-xs">
                      {scraperData.brandEntities.map((brand: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">{brand.title}</span>
                            {brand.category && (
                              <p className="text-[10px] text-muted-foreground uppercase">{brand.category}</p>
                            )}
                          </div>
                          <Badge variant="outline">{brand.type?.replace('chat_gpt_', '').replace('gemini_', '') || 'brand'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Citations/References used */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span>Search Citations (Sources)</span>
                    <Badge variant="secondary">{scraperData.sources?.length ?? 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!scraperData.sources || scraperData.sources.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 text-center">No citation references used.</p>
                  ) : (
                    <div className="divide-y divide-border text-xs">
                      {scraperData.sources.map((src: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                              {src.title || src.source_name || 'Search Source'}
                            </span>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5 shrink-0"
                            >
                              Visit link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{src.url}</p>
                          {src.publication_date && (
                            <p className="text-[9px] text-muted-foreground">Published: {src.publication_date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raw JSON Inspect */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Raw API Payload</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <details className="cursor-pointer group">
                    <summary className="px-6 py-3 text-xs text-indigo-500 hover:text-indigo-400 select-none">
                      Click to inspect raw JSON response
                    </summary>
                    <pre className="text-[10px] bg-zinc-900 text-zinc-100 p-4 overflow-x-auto select-text font-mono max-h-[300px]">
                      {JSON.stringify(scraperData.rawResponse, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            </div>
          )}

          {!isRunning && !scraperData && !scraperError && (
            <div className="border-2 border-dashed border-border p-12 text-center rounded-xl">
              <Sparkles className="w-8 h-8 text-indigo-500/55 mx-auto mb-3" />
              <p className="text-sm font-semibold">Ready to test Scraper</p>
              <p className="text-xs text-muted-foreground mt-1">Configure parameters above and compare.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
