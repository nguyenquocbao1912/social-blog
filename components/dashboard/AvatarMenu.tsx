"use client"

import { useState } from "react"
import { LogOut, Users } from "lucide-react"
import PixelAvatar from "@/components/ui/PixelAvatar"

import { useSession } from "next-auth/react"

export default function AvatarMenu({
  onFriends,
  onLogout,
}: {
  onFriends: () => void
  onLogout: () => void
}) {
  const { data: session } = useSession()
  const userName = session?.user?.name
  const userAvatar = session?.user?.avatar
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="avatar-menu-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        aria-expanded={open}
      >
        <PixelAvatar user={{ name: userName, avatar: userAvatar }} className="avatar-menu-icon" />
      </button>

      {open && (
        <>
          <button
            className="avatar-menu-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="avatar-menu-dropdown" role="menu">
            <div className="avatar-menu-user">
              <PixelAvatar user={{ name: userName, avatar: userAvatar }} className="avatar-menu-dropdown-icon" />
              {userName}
            </div>
            <hr className="avatar-menu-sep" />
            <button
              className="avatar-menu-item"
              role="menuitem"
              onClick={() => { setOpen(false); onFriends() }}
            >
              <Users size={16} aria-hidden="true" /> Friends
            </button>
            <button
              className="avatar-menu-item avatar-menu-logout"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout() }}
            >
              <LogOut size={16} aria-hidden="true" /> Exit
            </button>
          </div>
        </>
      )}
    </>
  )
}
