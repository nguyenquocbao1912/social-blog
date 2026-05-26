import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lấy số like và trạng thái đã like chưa
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Đếm tổng số like
    const likeCount = await prisma.like.count({
        where: { postId: Number(id) }
    })

    // Kiểm tra user hiện tại đã like chưa
    let liked = false
    if (session?.user) {
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: Number(session.user.id),
                    postId: Number(id)
                }
            }
        })
        liked = !!existingLike  // có like → true, không có → false
    }

    return NextResponse.json({ likeCount, liked })
}