import { FolderOpen, NotebookPen } from "lucide-react"
import PostCard from "@/components/dashboard/PostCard"
import PostSkeleton from "@/components/ui/PostSkeleton"
import type { Post } from "@/lib/types"

export default function MyPostsFeed({
  myPosts,
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
  myPosts: Post[]
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
  return (
    <div>
      <div className="page-title">
        <FolderOpen size={18} aria-hidden="true" />
        MY POSTS <span className="blink">_</span>
      </div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-num">{myPosts.length}</span>
          <span className="stat-label">POSTS</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{myPosts.filter(p => p.published).length}</span>
          <span className="stat-label">PUBLISHED</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{myPosts.filter(p => !p.published).length}</span>
          <span className="stat-label">DRAFTS</span>
        </div>
      </div>
      {loadingPosts ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : myPosts.length === 0 ? (
        <div className="empty-state">
          <NotebookPen className="empty-icon" size={40} aria-hidden="true" />
          <div className="empty-text">You have no posts yet.<br />Go share something!</div>
        </div>
      ) : (
        myPosts.slice().reverse().map(p => (
          <PostCard
            key={p.id}
            post={p}
            isOwner={true}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onLike={onLike}
            onRequireLogin={onRequireLogin}
          />
        ))
      )}
      {!loadingPosts && myPosts.length > 0 && !isReachingEnd && (
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
