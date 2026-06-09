'use client'

import { useState, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function RunNowButton({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const router = useRouter()

  async function handleRun(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStatus('running')
    try {
      const res = await fetch('/api/run-project-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json() as { succeeded: number; failed: number; total: number; errors?: string[]; message?: string; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Run failed')

      if (data.total === 0) {
        toast.info('No active prompts to run')
      } else if (data.succeeded === 0 && data.failed > 0) {
        const firstError = data.errors?.[0] ?? 'Check server logs for details'
        toast.error(`All runs failed — ${firstError}`)
      } else if (data.failed > 0) {
        const firstError = data.errors?.[0] ?? 'unknown error'
        toast.warning(`${data.succeeded}/${data.total} platform runs succeeded — ${firstError}`)
      } else {
        toast.success(`${data.succeeded} platform run${data.succeeded !== 1 ? 's' : ''} completed successfully`)
      }

      setStatus('done')
      router.refresh()
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('idle')
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleRun}
      disabled={status === 'running'}
    >
      {status === 'running' ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : status === 'done' ? (
        <CheckCircle className="w-4 h-4 mr-2" />
      ) : (
        <Play className="w-4 h-4 mr-2" />
      )}
      {status === 'running' ? 'Running…' : status === 'done' ? 'Done' : 'Run Now'}
    </Button>
  )
}
