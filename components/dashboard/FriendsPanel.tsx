"use client"

import { useState, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import useSWR from "swr"
import {
  Check,
  Ellipsis,
  MessageCircle,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import PixelAvatar from "@/components/ui/PixelAvatar"
import { fetcher } from "@/lib/helpers"
import type { ActiveChat, ChatFriend, FriendRequest, LastMessage, RealFriend, SuggestedUser } from "@/lib/types"
import { useActionCooldown } from "@/hooks/useActionCooldown"

export default function FriendsPanel({
  onChat,
  compact = false,
  isAuthenticated,
}: {
  onChat?: (friend: ChatFriend) => void
  compact?: boolean
  isAuthenticated: boolean
}) {
  const [popupType, setPopupType] = useState<"requests" | "suggested" | "friends" | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const MAX_REQUESTS = 3
  const MAX_SUGGESTED = 3
  const MAX_FRIENDS = 5

  const { withCooldown } = useActionCooldown(2500)

  // SWR — tự động cache và refetch khi cần (Chỉ fetch khi đã đăng nhập)
  const { data: friends = [], mutate: mutateFriends } = useSWR<RealFriend[]>(isAuthenticated ? "/api/friends" : null, fetcher)
  const { data: requests = [], mutate: mutateRequests } = useSWR<FriendRequest[]>(isAuthenticated ? "/api/friends/requests" : null, fetcher)
  const { data: allUsers = [], mutate: mutateUsers } = useSWR<SuggestedUser[]>(isAuthenticated ? "/api/users" : null, fetcher)
  const { data: conversations = [], mutate: mutateConversations } = useSWR<ActiveChat[]>(isAuthenticated ? "/api/conversations" : null, fetcher)

  const loading = isAuthenticated && !friends && !requests && !allUsers

  const suggestedUsers = Array.isArray(allUsers) ? allUsers.filter(u =>
    u.friendshipStatus === "none" ||
    u.friendshipStatus === "pending_sent" ||
    u.friendshipStatus === "rejected"
  ) : []

  const conversationsByFriend: Record<number, ActiveChat> = Array.isArray(conversations)
    ? Object.fromEntries(conversations.map((c: ActiveChat) => [c.friend.id, c]))
    : {}

  const refreshAll = useCallback(() => {
    mutateFriends()
    mutateRequests()
    mutateUsers()
    mutateConversations()
  }, [mutateFriends, mutateRequests, mutateUsers, mutateConversations])

  const handleRequest = async (id: number, action: "accepted" | "rejected") => {
    await fetch(`/api/friendships/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    })
    refreshAll()
  }

  const handleUnfriend = async (friendshipId: number) => {
    if (!confirm("Remove this friend?")) return
    await fetch(`/api/friendships/${friendshipId}`, { method: "DELETE" })
    refreshAll()
  }

  const handleSendRequest = async (receiverId: number) => {
    await fetch("/api/friendships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    })
    refreshAll()
  }

  const handleCancelRequest = async (friendshipId: number) => {
    await fetch(`/api/friendships/${friendshipId}`, { method: "DELETE" })
    refreshAll()
  }

  const getLastMessagePreview = (message: LastMessage | null | undefined) => {
    if (!message) return null
    return message.content.length > 28 ? `${message.content.slice(0, 28)}...` : message.content
  }

  // --- Render Helpers ---

  const renderRequest = (req: FriendRequest) => (
    <div key={req.id} className="friend-request-card">
      <PixelAvatar user={req.sender} className="dummy-user-avatar" style={{ width: 28, height: 28, fontSize: 13 }} />
      <div className="dummy-user-info">
        {req.sender.name}
      </div>
      <div className="friend-req-actions">
        <button className="btn-req-accept" onClick={withCooldown(() => handleRequest(req.id, "accepted"))} aria-label="Accept">
          <Check size={16} aria-hidden="true" />
        </button>
        <button className="btn-req-reject" onClick={withCooldown(() => handleRequest(req.id, "rejected"))} aria-label="Reject">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )

  const renderSuggested = (user: SuggestedUser) => (
    <div key={user.id} className="dummy-user-card">
      <PixelAvatar user={user} className="dummy-user-avatar" />
      <div className="dummy-user-info">
        {user.name}
      </div>
      {user.friendshipStatus === "pending_sent" ? (
        <button
          className="btn-req-reject"
          onClick={withCooldown(() => handleCancelRequest(user.friendshipId!))}
          title="Cancel Request"
          style={{ fontSize: 9, width: "auto", padding: "0 6px" }}
        >
          CANCEL
        </button>
      ) : (
        <button
          className="btn-follow"
          aria-label={`Add friend ${user.name}`}
          onClick={withCooldown(() => handleSendRequest(user.id))}
          title="Add Friend"
        >
          <UserPlus size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  )

  const renderFriend = (friendObj: RealFriend) => {
    const { friendshipId, friend } = friendObj
    const lastMessage = getLastMessagePreview(conversationsByFriend[friend.id]?.lastMessage)
    return (
      <div key={friend.id} className="dummy-user-card">
        <PixelAvatar user={friend} className="dummy-user-avatar" />
        <div className="dummy-user-info">
          <div className="dummy-user-name">{friend.name}</div>
          <div className="dummy-user-status status-online">
            {lastMessage ?? "Start a chat"}
          </div>
        </div>
        <div className="friend-req-actions">
          <button
            className="btn-follow"
            aria-label={`Message ${friend.name}`}
            onClick={withCooldown(() => { onChat?.(friend); setPopupType(null) })}
            title="Message"
          >
            <MessageCircle size={18} aria-hidden="true" />
          </button>
          <button
            className="btn-follow"
            aria-label={`Unfriend ${friend.name}`}
            onClick={withCooldown(() => { handleUnfriend(friendshipId) })}
            title="Unfriend"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  const popupConfig = {
    requests: {
      title: "FRIEND REQUESTS",
      emptyText: "No friend requests",
      renderList: () => requests.map(renderRequest),
      isEmpty: requests.length === 0,
    },
    suggested: {
      title: "SUGGESTED FRIENDS",
      emptyText: "No suggested users",
      renderList: () => suggestedUsers.map(renderSuggested),
      isEmpty: suggestedUsers.length === 0,
    },
    friends: {
      title: "MY FRIENDS",
      emptyText: "No friends yet",
      renderList: () => friends.map(renderFriend),
      isEmpty: friends.length === 0,
    }
  }

  const currentPopup = popupType ? popupConfig[popupType] : null

  return (
    <>
      <aside className={compact ? "friends-panel compact" : "friends-panel"} aria-label="Friends panel">
        <div className="friends-panel-head">
          <div className="right-sidebar-title">FRIENDS</div>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 9, color: "var(--dim)" }}>Loading<span className="blink">_</span></div>
        ) : !isAuthenticated ? (
          <div style={{ padding: 16, fontSize: 10, color: "var(--dim)", textAlign: "center", lineHeight: 1.5 }}>
            You need to login!
          </div>
        ) : (
          <>
            {/* ── Friend Requests ── */}
            {requests.length > 0 && (
              <>
                <div className="friend-requests-title">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Users size={16} aria-hidden="true" />
                    REQUESTS
                  </span>
                  {requests.length > MAX_REQUESTS && (
                    <button className="friend-req-more" onClick={() => setPopupType("requests")}>
                      <Ellipsis size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="friend-requests-section">
                  {requests.slice(0, MAX_REQUESTS).map(renderRequest)}
                </div>
                <div className="pixel-divider" style={{ margin: "16px 0 8px" }} />
              </>
            )}

            {/* ── Suggested Users ── */}
            {suggestedUsers.length > 0 && (
              <>
                <div className="friend-requests-title">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Users size={16} aria-hidden="true" />
                    SUGGESTED
                  </span>
                  {suggestedUsers.length > MAX_SUGGESTED && (
                    <button className="friend-req-more" onClick={() => setPopupType("suggested")}>
                      <Ellipsis size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="dummy-user-list">
                  {suggestedUsers.slice(0, MAX_SUGGESTED).map(renderSuggested)}
                </div>
                <div className="pixel-divider" style={{ margin: "16px 0 8px" }} />
              </>
            )}

            {/* ── Friends List ── */}
            <div className="friend-requests-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <User size={16} aria-hidden="true" />
                MY FRIENDS
              </span>
              {friends.length > MAX_FRIENDS && (
                <button className="friend-req-more" onClick={() => setPopupType("friends")}>
                  <Ellipsis size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="dummy-user-list">
              {friends.length === 0 ? (
                <div style={{ padding: "0 0 12px 0", fontSize: 9, color: "var(--dim)" }}>No friends yet</div>
              ) : (
                friends.slice(0, MAX_FRIENDS).map(renderFriend)
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Popup / Modals ── */}
      {mounted && currentPopup && createPortal(
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ zIndex: 301 }}>
          {/* Header cố định, không cuộn */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
            <div className="page-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              {currentPopup.title}
            </div>
            <button
              className="btn-icon-text"
              onClick={() => setPopupType(null)}
              style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Phần cuộn riêng */}
          <div className="modal-scroll-body">
            {currentPopup.isEmpty ? (
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: 12 }}>
                {currentPopup.emptyText}
              </div>
            ) : (
              <div className="user-grid">
                {currentPopup.renderList()}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
