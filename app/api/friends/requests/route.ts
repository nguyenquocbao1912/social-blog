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

  // Lời mời người khác gửi cho mình, chưa xử lý
  const requests = await prisma.friendship.findMany({
    where: {
      receiverId: Number(session.user.id),
      status: "pending"
    },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(requests)
}