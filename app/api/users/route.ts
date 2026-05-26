import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { deleteCloudinaryImage } from "@/lib/cloudinary"
import { EditAccountSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập" },
      { status: 401 }
    )
  }

  const currentUserId = Number(session.user.id)

  // Lấy tất cả user trừ chính mình
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId }
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      // Lấy kèm trạng thái kết bạn với mình
      sentFriendships: {
        where: { receiverId: currentUserId },
        select: { status: true, id: true }
      },
      receivedFriendships: {
        where: { senderId: currentUserId },
        select: { status: true, id: true }
      }
    }
  })

  // Xử lý thêm trạng thái quan hệ cho dễ dùng ở frontend
  const usersWithStatus = users.map(user => {
    // Mình gửi lời mời cho họ
    const sent = user.receivedFriendships[0]
    // Họ gửi lời mời cho mình
    const received = user.sentFriendships[0]

    let friendshipStatus = "none"      // Chưa có quan hệ
    let friendshipId = null

    if (sent) {
      friendshipStatus = sent.status === "pending" ? "pending_sent" : sent.status
      friendshipId = sent.id
    } else if (received) {
      friendshipStatus = received.status === "pending" ? "pending_received" : received.status
      friendshipId = received.id
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      friendshipStatus,  // "none" | "pending" | "accepted" | "rejected"
      friendshipId,
    }
  })

  return NextResponse.json(usersWithStatus)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    )
  }

  const body = await request.json()
  const validation = EditAccountSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, avatar, password } = validation.data

  // Lấy avatar hiện tại trước khi update
  const currentUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { avatar: true }
  })

  const updatedUser = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      name, avatar: avatar || null, ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
    }
  })

  // Xóa avatar cũ trên Cloudinary nếu bị thay thế hoặc xóa
  const oldAvatar = currentUser?.avatar
  if (
    oldAvatar &&
    oldAvatar.includes("cloudinary.com") &&
    oldAvatar !== (avatar || null)
  ) {
    deleteCloudinaryImage(oldAvatar).catch(() => { })
  }

  return NextResponse.json(updatedUser)
}
