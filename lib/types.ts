/* ── Shared Type Definitions ─────────────────────────────────── */

export type Post = {
  id: number
  title: string
  content: string
  thumbnail: string | null
  published: boolean
  createdAt: string
  userId: number
  author: { id: number; name: string; email: string; avatar: string | null }
  likes: { userId: number }[]
  _count: { comments: number }
}

export type Comment = {
  id: number
  content: string
  createdAt: string
  author: { id: number; name: string; email: string; avatar: string | null }
  replies?: Comment[]
}

export type NotifState = { msg: string; type: "success" | "error" | "info" }
export type View = "home" | "myPosts" | "createPost" | "editPost" | "profile"

export type RealFriend = {
  friendshipId: number
  friend: { id: number; name: string; email: string; avatar: string | null; bio: string | null }
}

export type FriendRequest = {
  id: number
  senderId: number
  sender: { id: number; name: string; email: string; avatar: string | null }
  createdAt: string
}

export type SuggestedUser = {
  id: number
  name: string
  email: string
  avatar: string | null
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected"
  friendshipId: number | null
}

export type ChatFriend = { id: number; name: string; email: string; avatar: string | null }

export type LastMessage = {
  id: number
  content: string
  senderId: number
  read: boolean
  createdAt: string
}

export type ActiveChat = {
  id: number
  friend: ChatFriend
  lastMessage?: LastMessage | null
  updatedAt?: string
}

export type ChatMessage = {
  id: number
  content: string
  senderId: number
  read: boolean
  createdAt: string
  sender: ChatFriend
}

export type AvatarUser = {
  name?: string | null
  avatar?: string | null
}
