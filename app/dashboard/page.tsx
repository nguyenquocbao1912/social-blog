"use client"

import { useSession, signOut } from "next-auth/react"
import { useCallback, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import useSWRInfinite from "swr/infinite"
import {
  Gamepad2,
  LogIn,
  LogOut,
  Menu,
  Users,
} from "lucide-react"
import { useState } from "react"
import Notification from "@/components/ui/Notification"
import PixelAvatar from "@/components/ui/PixelAvatar"
import AvatarMenu from "@/components/dashboard/AvatarMenu"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import FriendsPanel from "@/components/dashboard/FriendsPanel"
import { useTheme } from "@/components/providers"
import { fetcher, uploadImageToCloudinary } from "@/lib/helpers"
import type { ActiveChat, ChatFriend, NotifState, Post, View } from "@/lib/types"

import MyPostsFeed from "@/components/dashboard/MyPostsFeed"
import CommunityFeed from "@/components/dashboard/CommunityFeed"

// Lazy load heavy components — chỉ tải khi cần
const PostEditor = lazy(() => import("@/components/dashboard/PostEditor"))
const AccountEditor = lazy(() => import("@/components/dashboard/AccountEditor"))
const ChatWindow = lazy(() => import("@/components/dashboard/ChatWindow"))

import IconButton from "@/components/ui/IconButton"
/* ── Main Dashboard ──────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const [saving, setSaving] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [view, setView] = useState<View>("home")
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [notif, setNotif] = useState<NotifState | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFriendsOpen, setIsFriendsOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)

  const notify = useCallback((msg: string, type: NotifState["type"] = "success") => {
    setNotif({ msg, type })
  }, [])

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null
    if (pageIndex === 0) return `/api/posts?limit=10`
    return `/api/posts?limit=10&cursor=${previousPageData.nextCursor}`
  }

  const { data: postsData, size, setSize, mutate: mutatePosts, isLoading: loadingPosts } = useSWRInfinite(getKey, fetcher)

  // Flatten posts từ các trang
  const posts: Post[] = postsData ? postsData.flatMap(page => (page.data || []) as Post[]) : []
  const isLoadingMore: boolean = !!(loadingPosts || (size > 0 && postsData && typeof postsData[size - 1] === "undefined"))
  const isEmpty: boolean = postsData?.[0]?.data?.length === 0
  const isReachingEnd: boolean = !!(isEmpty || (postsData && !postsData[postsData.length - 1]?.nextCursor))

  // Helpers cập nhật optimistic state cho useSWRInfinite
  const removePostOptimistic = (id: number) => {
    mutatePosts(currentData => {
      if (!currentData) return currentData
      return currentData.map(page => ({
        ...page,
        data: page.data.filter((p: Post) => p.id !== id)
      }))
    }, false)
  }

  const updatePostOptimistic = (updatedPost: Post) => {
    mutatePosts(currentData => {
      if (!currentData) return currentData
      return currentData.map(page => ({
        ...page,
        data: page.data.map((p: Post) => p.id === updatedPost.id ? updatedPost : p)
      }))
    }, false)
  }

  const addPostOptimistic = (newPost: Post) => {
    mutatePosts(currentData => {
      if (!currentData) return currentData
      const newData = [...currentData]
      newData[0] = { ...newData[0], data: [newPost, ...newData[0].data] }
      return newData
    }, false)
  }

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Gamepad2 className="loading-icon" size={34} aria-hidden="true" />
        <div style={{ fontFamily: "var(--pixel-font)", fontSize: 10, color: "var(--pink)" }}>
          LOADING<span className="blink">_</span>
        </div>
      </div>
    )
  }

  const isAuthenticated = status === "authenticated"
  const currentUserId = isAuthenticated ? Number(session?.user?.id) : -1

  /* ── Handlers ── */
  const handleLogout = async () => {
    notify(`See you, @${session?.user?.name}!`, "info")
    setTimeout(() => signOut({ callbackUrl: "/login" }), 800)
  }

  const handleDelete = async (id: number) => {
    if (!isAuthenticated) return notify("You need to login!", "info")
    if (!window.confirm("Delete this post?")) return
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) {
      removePostOptimistic(id)
      notify("Post deleted!", "info")
    } else {
      notify(data.error, "error")
    }
  }

  const handleLike = async (postId: number) => {
    if (!isAuthenticated) return notify("You need to login!", "info")
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
    const data = await res.json()
    if (res.ok) {
      const currentUserId = Number(session?.user?.id)
      const p = posts.find(post => post.id === postId)
      if (p) {
        if (data.liked) {
          updatePostOptimistic({ ...p, likes: [...(p.likes || []), { userId: currentUserId }] })
        } else {
          updatePostOptimistic({ ...p, likes: (p.likes || []).filter((l: { userId: number }) => l.userId !== currentUserId) })
        }
      }
    } else {
      notify(data.error, "error")
    }
  }

  const handleSavePost = async (
    title: string,
    content: string,
    published: boolean,
    existingThumbnail: string,
    pendingFile: File | null,
    oldThumbnail: string
  ) => {
    if (!isAuthenticated) return notify("You need to login!", "info")
    setSaving(true)
    const isEditing = editingPost !== null

    let finalThumbnail = existingThumbnail
    if (pendingFile) {
      try {
        finalThumbnail = await uploadImageToCloudinary(pendingFile)
      } catch (err: unknown) {
        notify(err instanceof Error ? err.message : "Image upload failed", "error")
        setSaving(false)
        return
      }
    }

    const res = await fetch(
      isEditing ? `/api/posts/${editingPost!.id}` : "/api/posts",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, published, thumbnail: finalThumbnail }),
      }
    )
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { notify(data.error, "error"); return }

    if (isEditing) {
      updatePostOptimistic(data)
      notify("Post updated successfully!")
    } else {
      addPostOptimistic(data)
      notify("Post created successfully!")
    }

    setEditingPost(null)
    setView("myPosts")
  }

  const handleSaveAccount = async (
    name: string,
    existingAvatar: string,
    pendingFile: File | null,
    oldAvatar: string,
    password: string
  ) => {
    setAccountSaving(true)

    let finalAvatar = existingAvatar
    if (pendingFile) {
      try {
        finalAvatar = await uploadImageToCloudinary(pendingFile)
      } catch (err: unknown) {
        notify(err instanceof Error ? err.message : "Avatar upload failed", "error")
        setAccountSaving(false)
        return false
      }
    }

    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar: finalAvatar, password }),
    })
    const data = await res.json()
    setAccountSaving(false)

    if (!res.ok) {
      notify(data.error || "Account update failed", "error")
      return false
    }

    await updateSession({ user: { name: data.name, avatar: data.avatar } })
    mutatePosts(currentData => {
      if (!currentData) return currentData
      return currentData.map(page => ({
        ...page,
        data: page.data.map((post: Post) =>
          post.userId === data.id
            ? { ...post, author: { ...post.author, name: data.name, avatar: data.avatar } }
            : post
        )
      }))
    }, false)
    notify("Account updated!", "success")
    return true
  }

  const handleDeleteAccount = async (password: string) => {
    setIsDeletingAccount(true)
    try {
      const userId = session?.user?.id
      if (!userId) throw new Error("Không tìm thấy ID người dùng")

      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Đã xảy ra lỗi khi xóa tài khoản")

      notify(data.message, "info")
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1000)
      // Không gọi setIsDeletingAccount(false) nếu thành công để giữ màn hình khóa cho tới khi đăng xuất
    } catch (err) {
      setIsDeletingAccount(false)
      throw err
    }
  }

  const handleNavigate = (nextView: View) => {
    if (!isAuthenticated && nextView !== "home") {
      return notify("You need to login!", "info")
    }
    if (nextView === "createPost") setEditingPost(null)
    setView(nextView)
    setIsSidebarOpen(false)
  }

  const openSidebar = () => { setIsFriendsOpen(false); setIsSidebarOpen(true) }
  const openFriends = () => {
    setIsSidebarOpen(false);
    setIsFriendsOpen(true)
  }

  const openChat = async (friend: ChatFriend) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: friend.id }),
    })
    const data = await res.json()
    if (!res.ok) { notify(data.error || "Không mở được cuộc trò chuyện", "error"); return }
    setActiveChat(data)
    setIsFriendsOpen(false)
    setIsSidebarOpen(false)
  }

  const isOwner = (post: Post) => isAuthenticated && session?.user?.id === String(post.userId)
  const myPosts = posts.filter(p => isOwner(p))

  /* ── Render content ── */
  const renderContent = () => {
    if (view === "createPost" || (view === "editPost" && editingPost)) {
      return (
        <Suspense fallback={<div style={{ padding: 32, textAlign: "center", color: "var(--dim)" }}>Loading<span className="blink">_</span></div>}>
          <PostEditor
            editPost={editingPost}
            onSave={handleSavePost}
            onCancel={() => { setView("myPosts"); setEditingPost(null) }}
            loading={saving}
          />
        </Suspense>
      )
    }

    if (view === "profile") {
      return (
        <Suspense fallback={<div style={{ padding: 32, textAlign: "center", color: "var(--dim)" }}>Loading<span className="blink">_</span></div>}>
          <AccountEditor
            key={`${session?.user?.id ?? "guest"}:${session?.user?.avatar ?? ""}`}
            user={{ id: session?.user?.id, name: session?.user?.name, avatar: session?.user?.avatar }}
            loading={accountSaving}
            onSave={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        </Suspense>
      )
    }

    if (view === "myPosts") {
      return (
        <MyPostsFeed
          myPosts={myPosts}
          loadingPosts={loadingPosts}
          currentUserId={currentUserId}
          onEdit={p => { setEditingPost(p); setView("editPost") }}
          onDelete={handleDelete}
          onLike={handleLike}
          onRequireLogin={() => notify("You need to login!", "info")}
          isLoadingMore={isLoadingMore}
          isReachingEnd={isReachingEnd}
          onLoadMore={() => setSize(size + 1)}
        />
      )
    }

    // home — community feed
    return (
      <CommunityFeed
        posts={posts}
        myPostsCount={myPosts.length}
        loadingPosts={loadingPosts}
        currentUserId={currentUserId}
        onEdit={p => { setEditingPost(p); setView("editPost") }}
        onDelete={handleDelete}
        onLike={handleLike}
        onRequireLogin={() => notify("You need to login!", "info")}
        isLoadingMore={isLoadingMore}
        isReachingEnd={isReachingEnd}
        onLoadMore={() => setSize(size + 1)}
      />
    )
  }

  /* ── Shell ── */
  return (
    <div id="app">
      {/* Global Processing Lock */}
      {(saving || accountSaving || isDeletingAccount) && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, cursor: "wait"
        }} />
      )}

      {notif && (
        <Notification msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <IconButton
            label="Open sidebar"
            icon={Menu}
            onClick={openSidebar}
            className="menu-toggle"
            expanded={isSidebarOpen}
          />
          <button className="logo" onClick={() => handleNavigate("home")} type="button">
            <span className="logo-icon">PV</span>
            PIXELVERSE
          </button>
        </div>

        <nav className="topbar-nav">
          <div className="topbar-mobile-only">
            {isAuthenticated ? (
              <AvatarMenu
                onFriends={openFriends}
                onLogout={handleLogout}
              />
            ) : (
              <button
                className="btn btn-mint"
                onClick={() => router.push("/login")}
                style={{ fontSize: 10 }}
              >
                LOGIN
              </button>
            )}
          </div>

          <div className="topbar-desktop-nav">
            {isAuthenticated ? (
              <>
                <div className="user-badge" title={`${session?.user?.name}`}>
                  <PixelAvatar user={{ name: session?.user?.name, avatar: session?.user?.avatar }} className="user-badge-avatar" />
                </div>
                <IconButton
                  label="Open friends"
                  icon={Users}
                  onClick={openFriends}
                  className="friends-toggle"
                  expanded={isFriendsOpen}
                />
                <button
                  id="btn-logout"
                  className="btn btn-red btn-icon-text logout-btn"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut size={16} aria-hidden="true" />
                  EXIT
                </button>
              </>
            ) : (
              <button
                className="btn btn-mint btn-icon-text"
                onClick={() => router.push("/login")}
              >
                <LogIn size={16} aria-hidden="true" />
                LOGIN
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Drawers backdrop */}
      {(isSidebarOpen || isFriendsOpen) && (
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Close panel"
          onClick={() => { setIsSidebarOpen(false); setIsFriendsOpen(false) }}
        />
      )}

      <div className={`mobile-drawer sidebar-drawer${isSidebarOpen ? " open" : ""}`}>
        <DashboardSidebar
          view={view}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setIsSidebarOpen(false)}
          showClose
        />
      </div>

      <div className={`mobile-drawer friends-drawer${isFriendsOpen ? " open" : ""}`}>
        <FriendsPanel
          onChat={openChat}
          compact
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Body */}
      <div className="main">
        <div className="desktop-sidebar">
          <DashboardSidebar
            view={view}
            onNavigate={handleNavigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        <main className="content">
          {activeChat && (
            <Suspense fallback={null}>
              <ChatWindow
                conversation={activeChat}
                currentUserId={currentUserId}
                onClose={() => setActiveChat(null)}
                notify={notify}
              />
            </Suspense>
          )}
          <div className={activeChat ? "content-body mobile-hidden-while-chat" : "content-body"}>
            {renderContent()}
          </div>
        </main>

        <FriendsPanel onChat={openChat} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  )
}
