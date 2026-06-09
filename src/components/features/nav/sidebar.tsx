'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { BarChart3, Brain, FileSearch, Globe, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { signOut } from '@/app/(auth)/login/actions'
import type { Route } from 'next'

interface SidebarProps {
  projectId: string
  projectName: string
}

const navItems = (projectId: string) => [
  { href: `/${projectId}/overview`,    label: 'Overview',        icon: LayoutDashboard },
  { href: `/${projectId}/prompts`,     label: 'Prompt Tracking', icon: Brain },
  { href: `/${projectId}/outreach`,    label: 'Outreach Finder', icon: FileSearch },
  { href: `/${projectId}/citations`,   label: 'Citations',       icon: Globe },
  { href: `/${projectId}/competitors`, label: 'Competitors',     icon: Users },
  { href: `/${projectId}/settings`,    label: 'Settings',        icon: Settings },
]

export function Sidebar({ projectId, projectName }: SidebarProps) {
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
              {projectName}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Analytics
        </p>
        {navItems(projectId).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
              pathname.startsWith(href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <FileSearch className="w-3.5 h-3.5" />
          All Projects
        </Link>
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
