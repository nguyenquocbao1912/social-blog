import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function pairIds(a: number, b: number) {
  return a < b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a }
}

async function requireUser() {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !Number.isInteger(userId)) {
    return { error: NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 }) }
  }

  return { userId }
}

async function areFriends(currentUserId: number, friendId: number) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { senderId: currentUserId, receiverId: friendId },
        { senderId: friendId, receiverId: currentUserId },
      ],
    },
  })

  return Boolean(friendship)
}

export async function GET() {
  const auth = await requireUser()
  if ("error" in auth) return auth.error

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: auth.userId },
        { user2Id: auth.userId },
      ],
    },
    include: {
      user1: { select: { id: true, name: true, email: true, avatar: true } },
      user2: { select: { id: true, name: true, email: true, avatar: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, read: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(conversations.map(conversation => ({
    id: conversation.id,
    friend: conversation.user1Id === auth.userId ? conversation.user2 : conversation.user1,
    lastMessage: conversation.messages[0] ?? null,
    updatedAt: conversation.updatedAt,
  })))
}

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if ("error" in auth) return auth.error

  const body = await request.json()
  const friendId = Number(body.friendId)

  if (!Number.isInteger(friendId) || friendId <= 0) {
    return NextResponse.json({ error: "Bạn cần chọn bạn bè để nhắn tin" }, { status: 400 })
  }

  if (friendId === auth.userId) {
    return NextResponse.json({ error: "Không thể tự nhắn tin với chính mình" }, { status: 400 })
  }

  if (!(await areFriends(auth.userId, friendId))) {
    return NextResponse.json({ error: "Chỉ có thể nhắn tin với bạn bè" }, { status: 403 })
  }

  const ids = pairIds(auth.userId, friendId)
  const conversation = await prisma.conversation.upsert({
    where: { user1Id_user2Id: ids },
    update: {},
    create: ids,
    include: {
      user1: { select: { id: true, name: true, email: true, avatar: true } },
      user2: { select: { id: true, name: true, email: true, avatar: true } },
    },
  })

  return NextResponse.json({
    id: conversation.id,
    friend: conversation.user1Id === auth.userId ? conversation.user2 : conversation.user1,
    updatedAt: conversation.updatedAt,
  })
}
