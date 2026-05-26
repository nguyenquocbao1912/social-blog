import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteCloudinaryImage } from "@/lib/cloudinary"
import { PostSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  })

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    )
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(id) }
  })

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    )
  }

  if (post.userId !== Number(session.user.id)) {
    return NextResponse.json(
      { error: "You do not have permission to edit this post" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const validation = PostSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { title, content, published, thumbnail } = validation.data

  const updatedPost = await prisma.post.update({
    where: { id: Number(id) },
    data: { title, content, published, thumbnail: thumbnail ?? undefined },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  })

  // Xóa thumbnail cũ trên Cloudinary nếu bị thay thế hoặc xóa
  if (
    post.thumbnail &&
    post.thumbnail.includes("cloudinary.com") &&
    post.thumbnail !== (thumbnail ?? null)
  ) {
    deleteCloudinaryImage(post.thumbnail).catch(() => {})
  }

  return NextResponse.json(updatedPost)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    )
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(id) }
  })

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    )
  }

  if (post.userId !== Number(session.user.id)) {
    return NextResponse.json(
      { error: "You do not have permission to delete this post" },
      { status: 403 }
    )
  }

  await prisma.post.delete({
    where: { id: Number(id) }
  })

  // Xóa thumbnail trên Cloudinary sau khi xóa post
  if (post.thumbnail && post.thumbnail.includes("cloudinary.com")) {
    deleteCloudinaryImage(post.thumbnail).catch(() => {})
  }

  return NextResponse.json(
    { message: "Post deleted successfully" }
  )
}
