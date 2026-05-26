"use client"

import { useEffect } from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

interface NotificationProps {
  msg: string
  type: "success" | "error" | "info"
  onClose: () => void
}

export default function Notification({ msg, type, onClose }: NotificationProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info

  return (
    <div className={`notif notif-${type}`} onClick={onClose}>
      <Icon size={16} aria-hidden="true" />
      <span>{msg}</span>
    </div>
  )
}
