import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    )
  }

  // Lấy tất cả bài của user này, kể cả bản nháp
  const posts = await prisma.post.findMany({
    where: { userId: Number(session.user.id) },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true } },
      likes: { select: { userId: true } },
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(posts)
}
