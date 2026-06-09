import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastScanned(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  // Round to nearest hour
  const minutes = date.getMinutes()
  if (minutes >= 30) {
    date.setHours(date.getHours() + 1)
  }
  date.setMinutes(0, 0, 0)
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
  })
}

