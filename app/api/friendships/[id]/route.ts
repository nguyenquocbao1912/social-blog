import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Chấp nhận hoặc từ chối lời mời
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập" },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { status } = body
  // status phải là "accepted" hoặc "rejected"

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Trạng thái không hợp lệ" },
      { status: 400 }
    )
  }

  const friendship = await prisma.friendship.findUnique({
    where: { id: Number(id) }
  })

  if (!friendship) {
    return NextResponse.json(
      { error: "Không tìm thấy lời mời" },
      { status: 404 }
    )
  }

  // Chỉ người nhận mới được chấp nhận/từ chối
  if (friendship.receiverId !== Number(session.user.id)) {
    return NextResponse.json(
      { error: "Bạn không có quyền thực hiện hành động này" },
      { status: 403 }
    )
  }

  const updated = await prisma.friendship.update({
    where: { id: Number(id) },
    data: { status }
  })

  return NextResponse.json(updated)
}

// Hủy kết bạn hoặc thu hồi lời mời
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập" },
      { status: 401 }
    )
  }

  const friendship = await prisma.friendship.findUnique({
    where: { id: Number(id) }
  })

  if (!friendship) {
    return NextResponse.json(
      { error: "Không tìm thấy" },
      { status: 404 }
    )
  }

  // Cả 2 người đều có thể hủy
  const currentUserId = Number(session.user.id)
  if (friendship.senderId !== currentUserId && friendship.receiverId !== currentUserId) {
    return NextResponse.json(
      { error: "Bạn không có quyền thực hiện hành động này" },
      { status: 403 }
    )
  }

  await prisma.friendship.delete({
    where: { id: Number(id) }
  })

  return NextResponse.json({ message: "Đã hủy kết bạn" })
}