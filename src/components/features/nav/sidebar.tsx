'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Brain, FileSearch, Globe, LayoutDashboard, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  projectId: string
  projectName: string
}

const navItems = (projectId: string) => [
  { href: `/${projectId}/overview`,     label: 'Overview',     icon: LayoutDashboard },
  { href: `/${projectId}/prompts`,      label: 'Prompt Tracking', icon: Brain },
  { href: `/${projectId}/citations`,    label: 'Citations',    icon: Globe },
  { href: `/${projectId}/competitors`,  label: 'Competitors',  icon: Users },
  { href: `/${projectId}/settings`,     label: 'Settings',     icon: Settings },
]

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r bg-white flex flex-col h-full">
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-sm truncate">{projectName}</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems(projectId).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700"
        >
          <FileSearch className="w-3 h-3" />
          All Projects
        </Link>
      </div>
    </aside>
  )
}
