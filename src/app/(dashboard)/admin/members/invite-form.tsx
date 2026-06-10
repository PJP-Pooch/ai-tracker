'use client'

import { useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteUser } from './actions'
import { toast } from 'sonner'

export function InviteForm() {
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviteUser(formData)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success) {
        toast.success(result.success)
        ref.current?.reset()
      }
    })
  }

  return (
    <form ref={ref} action={handleSubmit} className="flex gap-3">
      <Input
        name="email"
        type="email"
        required
        placeholder="colleague@example.com"
        className="flex-1"
        disabled={isPending}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}
