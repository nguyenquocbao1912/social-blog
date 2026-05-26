import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập" },
      { status: 401 }
    )
  }

  const currentUserId = Number(session.user.id)

  // Lấy tất cả friendship đã accepted
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true, bio: true } }
    }
  })

  // Lấy ra thông tin người kia (không phải mình)
  const friends = friendships.map(f => ({
    friendshipId: f.id,
    friend: f.senderId === currentUserId ? f.receiver : f.sender
  }))

  return NextResponse.json(friends)
}