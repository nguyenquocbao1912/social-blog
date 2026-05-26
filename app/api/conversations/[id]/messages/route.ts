import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lấy danh sách tin nhắn
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
  }

  const currentUserId = Number(session.user.id)

  // Kiểm tra có phải thành viên của conversation không
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(id) }
  })

  if (!conversation) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 })
  }

  if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
  }

  // Lấy tin nhắn
  const messages = await prisma.message.findMany({
    where: { conversationId: Number(id) },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } }
    },
    orderBy: { createdAt: "asc" }
  })

  // Đánh dấu tin nhắn của người kia là đã đọc
  await prisma.message.updateMany({
    where: {
      conversationId: Number(id),
      senderId: { not: currentUserId },
      read: false
    },
    data: { read: true }
  })

  return NextResponse.json(messages)
}

// Gửi tin nhắn mới
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
  }

  const currentUserId = Number(session.user.id)
  const body = await request.json()
  const { content } = body

  if (!content) {
    return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 })
  }

  // Kiểm tra có phải thành viên không
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(id) }
  })

  if (!conversation) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 })
  }

  if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
  }

  // Lưu tin nhắn
  const message = await prisma.message.create({
    data: {
      content,
      senderId: currentUserId,
      conversationId: Number(id),
    },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } }
    }
  })

  // Cập nhật updatedAt của conversation
  // để danh sách chat sắp xếp đúng thứ tự
  await prisma.conversation.update({
    where: { id: Number(id) },
    data: { updatedAt: new Date() }
  })

  return NextResponse.json(message, { status: 201 })
}
