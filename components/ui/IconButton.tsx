import type { LucideIcon } from "lucide-react"

export default function IconButton({
  label,
  icon: Icon,
  onClick,
  className = "",
  expanded,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  className?: string
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
    >
      <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
