// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteCloudinaryImage } from "@/lib/cloudinary"
import bcrypt from "bcryptjs"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // 1. Kiểm tra đăng nhập
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You need to login" },
      { status: 401 }
    )
  }

  // 2. Chỉ được xóa chính tài khoản của mình
  if (Number(session.user.id) !== Number(id)) {
    return NextResponse.json(
      { error: "You don't have permission to delete this account" },
      { status: 403 }
    )
  }

  // 3. Đọc password từ body
  const body = await request.json()
  const { password } = body

  if (!password) {
    return NextResponse.json(
      { error: "Please enter your password to confirm" },
      { status: 400 }
    )
  }

  // 4. Tìm tài khoản
  const account = await prisma.user.findUnique({
    where: { id: Number(id) }
  })

  if (!account) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    )
  }

  // 5. Xác nhận password
  const isCorrect = await bcrypt.compare(password, account.password)

  if (!isCorrect) {
    return NextResponse.json(
      { error: "Password not correct" },
      { status: 400 }
    )
  }

  // 6. Xóa ảnh trên Cloudinary trước
  // Cascade sẽ xóa DB nhưng không xóa được ảnh trên Cloudinary
  // nên phải xóa trực tiếp qua Cloudinary API (không dùng fetch nội bộ)
  const [posts] = await Promise.all([
    prisma.post.findMany({
      where: { userId: Number(id) },
      select: { thumbnail: true }
    }),
  ])

  // 6. Xóa tài khoản — Cascade tự xóa hết data liên quan (Xử lý DB rất nhanh)
  await prisma.user.delete({
    where: { id: Number(id) }
  })

  // 7. Xóa ảnh trên Cloudinary đưa vào Background Task
  // Cloudinary API tốn nhiều thời gian, đẩy vào after() để response trả về ngay lập tức
  after(async () => {
    try {
      if (account.avatar) {
        await deleteCloudinaryImage(account.avatar)
      }

      await Promise.allSettled(
        posts
          .filter(p => !!p.thumbnail)
          .map(p => deleteCloudinaryImage(p.thumbnail!))
      )
    } catch (e) {
      console.error("Background task error: ", e)
    }
  })

  return NextResponse.json(
    { message: "Account deleted successfully" }
  )
}