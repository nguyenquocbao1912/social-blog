import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !Number.isInteger(userId)) {
    return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: Number(id),
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
    include: {
      user1: { select: { id: true, name: true, email: true, avatar: true } },
      user2: { select: { id: true, name: true, email: true, avatar: true } },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện" }, { status: 404 })
  }

  return NextResponse.json({
    id: conversation.id,
    friend: conversation.user1Id === userId ? conversation.user2 : conversation.user1,
    updatedAt: conversation.updatedAt,
  })
}
