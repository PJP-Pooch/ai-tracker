'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from '@/lib/utils'

function TooltipProvider({ children, delay = 300 }: { children: React.ReactNode; delay?: number }) {
  return (
    <TooltipPrimitive.Provider delay={delay}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

function TooltipRoot({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
}

function TooltipTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TooltipPrimitive.Trigger className={cn('cursor-default', className)}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={8} side="top">
        <TooltipPrimitive.Popup
          className={cn(
            'z-50 max-w-xs rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-150',
            className
          )}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
