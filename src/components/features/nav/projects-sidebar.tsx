'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { BarChart3, FolderOpen, LogOut, Plus, Shield, ArrowRightLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { signOut } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

interface ProjectsSidebarProps {
  isAdmin?: boolean
}

export function ProjectsSidebar({ isAdmin }: ProjectsSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 leading-none mb-0.5">
              AI Tracker
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              All Projects
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Workspace
        </p>
        <Link
          href="/projects"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
            pathname === '/projects'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <FolderOpen className="w-4 h-4 shrink-0" />
          Projects
        </Link>
        <Link
          href="/projects/new"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
            pathname === '/projects/new'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          New Project
        </Link>
        <Link
          href="/projects/comparison"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
            pathname === '/projects/comparison'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          Compare APIs
        </Link>
        {isAdmin && (
          <Link
            href="/admin/members"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
              pathname === '/admin/members'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Shield className="w-4 h-4 shrink-0" />
            Members
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await signOut()
            })
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isPending ? 'Logging out...' : 'Log Out'}
        </button>
        <div className="px-3 py-2">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
