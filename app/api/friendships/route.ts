import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập" },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { receiverId } = body
  const senderId = Number(session.user.id)

  // Không thể kết bạn với chính mình
  if (senderId === Number(receiverId)) {
    return NextResponse.json(
      { error: "Không thể kết bạn với chính mình" },
      { status: 400 }
    )
  }

  // Kiểm tra đã có quan hệ chưa
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId: Number(receiverId) },
        { senderId: Number(receiverId), receiverId: senderId }
      ]
    }
  })

  if (existing) {
    return NextResponse.json(
      { error: "Đã tồn tại quan hệ kết bạn" },
      { status: 409 }
    )
  }

  const friendship = await prisma.friendship.create({
    data: {
      senderId,
      receiverId: Number(receiverId),
      status: "pending"
    }
  })

  return NextResponse.json(friendship, { status: 201 })
}