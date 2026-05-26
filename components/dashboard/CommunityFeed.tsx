import { Globe2, Inbox } from "lucide-react"
import PostCard from "@/components/dashboard/PostCard"
import PostSkeleton from "@/components/ui/PostSkeleton"
import type { Post } from "@/lib/types"

export default function CommunityFeed({
  posts,
  myPostsCount,
  loadingPosts,
  currentUserId,
  onEdit,
  onDelete,
  onLike,
  onRequireLogin,
  isLoadingMore,
  isReachingEnd,
  onLoadMore,
}: {
  posts: Post[]
  myPostsCount: number
  loadingPosts: boolean
  currentUserId: number
  onEdit: (post: Post) => void
  onDelete: (id: number) => void
  onLike: (id: number) => void
  onRequireLogin: () => void
  isLoadingMore: boolean
  isReachingEnd: boolean
  onLoadMore: () => void
}) {
  const isOwner = (post: Post) => currentUserId === post.userId

  return (
    <div>
      <div className="page-title">
        <Globe2 size={18} aria-hidden="true" />
        COMMUNITY FEED <span className="blink">_</span>
      </div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-num">{posts.length}</span>
          <span className="stat-label">TOTAL POSTS</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{posts.filter(p => p.published).length}</span>
          <span className="stat-label">PUBLIC</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{myPostsCount}</span>
          <span className="stat-label">MY POSTS</span>
        </div>
      </div>
      {loadingPosts ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <Inbox className="empty-icon" size={40} aria-hidden="true" />
          <div className="empty-text">No posts yet.<br />Be the first to post!</div>
        </div>
      ) : (
        posts.map(p => (
          <PostCard
            key={p.id}
            post={p}
            isOwner={isOwner(p)}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onLike={onLike}
            onRequireLogin={onRequireLogin}
          />
        ))
      )}
      {!loadingPosts && !isReachingEnd && (
        <button
          className="btn btn-mint"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          style={{ width: "100%", marginTop: 16, padding: "12px", fontFamily: "var(--pixel-font)" }}
        >
          {isLoadingMore ? "LOADING..." : "LOAD MORE"}
        </button>
      )}
    </div>
  )
}
