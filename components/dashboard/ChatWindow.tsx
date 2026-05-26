"use client"

import { useState } from "react"
import useSWR from "swr"
import { Send, X } from "lucide-react"
import PixelAvatar from "@/components/ui/PixelAvatar"
import { fetcher, timeAgo } from "@/lib/helpers"
import type { ActiveChat, ChatMessage, NotifState } from "@/lib/types"

export default function ChatWindow({
  conversation,
  currentUserId,
  onClose,
  notify,
}: {
  conversation: ActiveChat
  currentUserId: number
  onClose: () => void
  notify: (msg: string, type?: NotifState["type"]) => void
}) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  // SWR với refreshInterval 5 giây thay cho setInterval thủ công
  // Tự dừng poll khi tab mất focus (revalidateOnFocus mặc định true)
  const { data: messages = [], mutate } = useSWR<ChatMessage[]>(
    `/api/conversations/${conversation.id}/messages`,
    fetcher,
    {
      refreshInterval: 5000,
      onError: (err) => notify(err.message || "Không tải được tin nhắn", "error"),
      // Cập nhật read status khi nhận tin mới
      onSuccess: (data) => data.map(m =>
        m.senderId === currentUserId ? m : { ...m, read: true }
      ),
    }
  )

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      notify(data.error || "Không gửi được tin nhắn", "error")
      return
    }

    // Optimistic update: thêm tin nhắn mới vào cache ngay lập tức
    mutate([...(messages || []), data], false)
    setDraft("")
  }

  return (
    <section className="chat-shell" aria-label={`Chat with ${conversation.friend.name}`}>
      <div className="chat-head">
        <div className="chat-peer">
          <PixelAvatar user={conversation.friend} className="chat-avatar" />
          <div className="chat-subtitle">
            <div className="chat-title">{conversation.friend.name}</div>
            <span>FRIEND</span>
          </div>
        </div>
        <button type="button" className="icon-btn chat-close" onClick={onClose} aria-label="Close chat">
          <X size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <div className="chat-messages">
        {!messages ? (
          <div className="chat-empty">Loading messages<span className="blink">_</span></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">Start a conversation with @{conversation.friend.name}</div>
        ) : (
          messages.map(message => {
            const mine = message.senderId === currentUserId
            return (
              <div key={message.id} className={`chat-row${mine ? " mine" : ""}`}>
                <div className="chat-bubble">
                  <div>{message.content}</div>
                  <span>{timeAgo(message.createdAt)} - {message.read ? "READ" : "UNREAD"}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="chat-compose">
        <input
          className="pixel-input"
          placeholder="Type a message..."
          value={draft}
          maxLength={1000}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSend() }}
        />
        <button className="btn btn-mint chat-send" onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
