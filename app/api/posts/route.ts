import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import { PostSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const cursor = url.searchParams.get("cursor")
  const limit = parseInt(url.searchParams.get("limit") || "10")

  const posts = await prisma.post.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
    where: { published: true },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      likes: {
        select: { userId: true }
      },
      _count: {
        select: { comments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null

  return NextResponse.json({
    data: posts,
    nextCursor
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if(!session || !session.user){
    return NextResponse.json(
      { error: "You must be logged in to create a post" },
      { status: 401 }
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

  const userId = Number(session.user.id)

  const post = await prisma.post.create({
    data: {
      title,
      content,
      published: published??false,
      thumbnail: thumbnail || null,
      userId,
    },
    include: {
      author:{
        select:{id: true, name: true, email:true, avatar: true}
      }
    }
  })

  return NextResponse.json(post, {status: 201})
}
