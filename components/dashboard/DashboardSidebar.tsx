"use client"

import { FileText, Home, Moon, Plus, Settings, Sun, type LucideIcon } from "lucide-react"
import type { ThemeMode } from "@/components/providers"
import type { View } from "@/lib/types"
import { preload } from "swr"
import { fetcher } from "@/lib/helpers"
import { useActionCooldown } from "@/hooks/useActionCooldown"

import { useSession } from "next-auth/react"

export default function DashboardSidebar({
  view,
  onNavigate,
  onClose,
  theme,
  onToggleTheme,
  showClose = false,
}: {
  view: View
  onNavigate: (nextView: View) => void
  onClose?: () => void
  theme: ThemeMode
  onToggleTheme: () => void
  showClose?: boolean
}) {
  const { data: session } = useSession()
  const { withCooldown } = useActionCooldown(1000)
  const userName = session?.user?.name
  const items: { view: View; label: string; icon: LucideIcon; active: boolean }[] = [
    { view: "createPost", label: "New Post", icon: Plus, active: view === "createPost" || view === "editPost" },
    { view: "home", label: "Feed", icon: Home, active: view === "home" },
    { view: "myPosts", label: "My Posts", icon: FileText, active: view === "myPosts" },
    { view: "profile", label: "Account", icon: Settings, active: view === "profile" },
  ]

  return (
    <nav className="sidebar" aria-label={userName ? `Dashboard navigation for ${userName}` : "Dashboard navigation"}>
      <div className="mobile-drawer-head">
        <span>MENU</span>
      </div>

      {items.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            className={`sidebar-item${item.active ? " active" : ""}`}
            onClick={() => onNavigate(item.view)}
            onMouseEnter={() => {
              if (item.view === "home" || item.view === "myPosts") {
                preload("/api/posts?limit=3", fetcher)
              }
            }}
          >
            <Icon className="sidebar-icon" size={16} aria-hidden="true" />
            {item.label}
          </button>
        )
      })}

      <div className="sidebar-theme-control">
        <button
          type="button"
          className="theme-toggle"
          onClick={withCooldown(onToggleTheme)}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
          <span>{theme === "dark" ? "LIGHT MODE" : "DARK MODE"}</span>
        </button>
      </div>
    </nav>
  )
}
