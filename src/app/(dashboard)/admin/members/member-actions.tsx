'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteUser } from './actions'
import { toast } from 'sonner'

export function MemberActions({ userId, email }: { userId: string; email: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${email} removed`)
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Remove {email}?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          {isPending ? 'Removing…' : 'Yes, remove'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500" onClick={() => setConfirming(true)}>
      Remove
    </Button>
  )
}
