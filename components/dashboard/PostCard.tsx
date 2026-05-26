"use client"

import { useState } from "react"
import {
  Edit3,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  X,
  Globe2,
  Lock,
} from "lucide-react"
import PixelAvatar from "@/components/ui/PixelAvatar"
import { timeAgo } from "@/lib/helpers"
import type { Post, Comment } from "@/lib/types"
import Image from "next/image"
import { useActionCooldown } from "@/hooks/useActionCooldown"

export default function PostCard({
  post,
  isOwner,
  currentUserId,
  onEdit,
  onDelete,
  onLike,
  onRequireLogin,
}: {
  post: Post
  isOwner: boolean
  currentUserId: number
  onEdit: (post: Post) => void
  onDelete: (id: number) => void
  onLike: (id: number) => void
  onRequireLogin: () => void
}) {
  const isLiked = post.likes?.some(l => l.userId === currentUserId)
  const { withCooldown } = useActionCooldown(3000);
  const [ratio, setRatio] = useState<string>('16 / 9');
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState("")
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null)

  const STATUS_COLORS: Record<string, string> = {
    published: "#E07A5F",
    draft: "#7D7495",
  }

  const toggleComments = async () => {
    if (!showComments) {
      setShowComments(true) // Mở khung UI ngay lập tức
      setLoadingComments(true)
      setCommentsError("")
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`, {
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load comments")
        }
        if (!Array.isArray(data)) {
          throw new Error("Invalid comments response")
        }
        setComments(data)
      } catch (err) {
        console.error("Failed to load comments", err)
        setCommentsError(err instanceof Error ? err.message : "Failed to load comments")
        setComments([])
      } finally {
        setLoadingComments(false)
      }
    } else {
      setShowComments(false)
    }
  }

  const handlePostComment = async () => {
    if (currentUserId === -1) return onRequireLogin()
    if (!newComment.trim()) return
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        content: newComment.trim(),
        parentId: replyingTo?.id || null
      }),
    })
    const data = await res.json()
    if (res.ok) {
      if (replyingTo) {
        setComments(comments.map(c => c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), data] } : c))
      } else {
        setComments([...comments, data])
      }
      setNewComment("")
      setReplyingTo(null)
    }
  }

  return (
    <div className="post-card">
      <div className="post-header">
        <PixelAvatar user={post.author} className="post-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-user">{post.author.name}</div>
          <div className="post-time">{timeAgo(post.createdAt)} 
            {post.published ? <Globe2 size={16} /> : <Lock size={16} />}
          </div>
        </div>
      </div>

      <div className="post-body">
        <div className="post-title">{post.title}</div>
        {post.thumbnail && (
          <div
            className="post-thumbnail-wrap"
            style={{ aspectRatio: ratio }}
          >
            <Image
              src={post.thumbnail}
              alt={`Cover for ${post.title}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 768px) 100vw, 600px"
              priority
              onLoad={(e) => {
                const img = e.currentTarget;
                setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
              }}
            />
          </div>
        )}
        <div className="post-content">
          {post.content.length > 160
            ? post.content.slice(0, 160) + "…"
            : post.content}
        </div>
      </div>

      <div className="post-footer">
        <button
          className={`post-action${isLiked ? ' liked' : ''}`}
          onClick={() => onLike(post.id)}
          aria-label={isLiked ? "Unlike post" : "Like post"}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
          {post.likes?.length || 0}
        </button>
        <button className="post-action" onClick={toggleComments} aria-expanded={showComments} aria-label="Toggle comments">
          <MessageCircle size={16} aria-hidden="true" />
          {post._count?.comments || 0}
        </button>
        {isOwner && (
          <>
            <button
              className="post-action post-edit-btn"
              style={{ marginLeft: "auto", color: "var(--yellow)", border: "2px solid var(--yellow)" }}
              onClick={withCooldown(() => onEdit(post))}
              aria-label="Edit post"
            >
              <Edit3 size={16} aria-hidden="true" />
              EDIT
            </button>
            <button
              className="post-action"
              style={{ color: "var(--red)", border: "2px solid var(--red)" }}
              onClick={withCooldown(() => onDelete(post.id))}
              aria-label="Delete post"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {
        showComments && (
          <div className="comments-section">
            {loadingComments ? (
              <div style={{ fontSize: 10, color: "var(--dim)", padding: 8 }}>Loading comments...</div>
            ) : commentsError ? (
              <div style={{ fontSize: 10, color: "var(--red)", padding: 8 }}>{commentsError}</div>
            ) : (
              <>
                {comments.map(c => (
                  <div key={c.id} className="comment-thread">
                    <div className="comment-item">
                      <PixelAvatar user={c.author ?? {}} className="comment-avatar" />
                      <div style={{ flex: 1 }}>
                        <div className="comment-user">@{c.author?.name}</div>
                        <div className="comment-text">{c.content}</div>
                        <div style={{ marginTop: 4 }}>
                          <button
                            className="auth-link"
                            style={{ fontSize: 9 }}
                            onClick={() => {
                              if (currentUserId === -1) return onRequireLogin()
                              setReplyingTo({ id: c.id, name: c.author?.name })
                            }}
                          >
                            REPLY
                          </button>
                          <span>{` ${timeAgo(c.createdAt)}`}</span>
                        </div>
                      </div>
                    </div>
                    {c.replies && c.replies.map(r => (
                      <div key={r.id} className="comment-item" style={{ paddingLeft: 46 }}>
                        <PixelAvatar user={r.author ?? {}} className="comment-avatar" />
                        <div style={{ flex: 1 }}>
                          <div className="comment-user">@{r.author?.name}</div>
                          <div className="comment-text">{r.content}</div>
                          <div style={{ marginTop: 4 }}>{timeAgo(c.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="comment-input-container" style={{ marginTop: 10 }}>
                  {replyingTo && (
                    <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                      <span>Replying to @{replyingTo.name}</span>
                      <button className="inline-icon-link danger" onClick={() => setReplyingTo(null)}>
                        <X size={16} aria-hidden="true" />
                        CANCEL
                      </button>
                    </div>
                  )}
                  <div className="comment-input-row" style={{ marginTop: 0 }}>
                    <input id="comments"
                      className="pixel-input"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    />
                    <button className="btn btn-mint btn-icon-text" onClick={handlePostComment}>
                      <Send size={16} aria-hidden="true" />
                      SEND
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      }
    </div >
  )
}
