import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return NextResponse.json(
            { error: "Bạn cần đăng nhập để like" },
            { status: 401 }
        )
    }

    const body = await request.json()
    const { postId } = body

    if (!postId) {
        return NextResponse.json(
            { error: "Thiếu postId" },
            { status: 400 }
        )
    }

    const userId = Number(session.user.id)

    // Kiểm tra đã like chưa
    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: { userId, postId: Number(postId) }
            // userId_postId là tên index từ @@unique([userId, postId]) trong schema
        }
    })

    if (existingLike) {
        // Đã like rồi → unlike
        await prisma.like.delete({
            where: {
                userId_postId: { userId, postId: Number(postId) }
            }
        })

        // Đếm lại số like sau khi unlike
        const likeCount = await prisma.like.count({
            where: { postId: Number(postId) }
        })

        return NextResponse.json({
            liked: false,
            likeCount,
            message: "Đã bỏ like"
        })
    } else {
        // Chưa like → like
        await prisma.like.create({
            data: { userId, postId: Number(postId) }
        })

        const likeCount = await prisma.like.count({
            where: { postId: Number(postId) }
        })

        return NextResponse.json({
            liked: true,
            likeCount,
            message: "Đã like"
        })
    }
}