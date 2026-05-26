"use client"

import type { CSSProperties } from "react"
import type { AvatarUser } from "@/lib/types"

import Image from "next/image"

export default function PixelAvatar({
  user,
  className,
  style,
}: {
  user: AvatarUser
  className: string
  style?: CSSProperties
}) {
  const initial = user.name?.charAt(0).toUpperCase() || "?"

  return (
    <span className={className} style={style} aria-label={user.name ? `${user.name} avatar` : "User avatar"}>
      {user.avatar ? (
        <Image src={user.avatar} alt="" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: "center" }} />
      ) : (
        initial
      )}
    </span>
  )
}
