import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Lấy tất cả comment của 1 bài viết
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const postId = Number(id)

    if (!Number.isInteger(postId) || postId <= 0) {
        return NextResponse.json(
            { error: "Invalid post id" },
            { status: 400 }
        )
    }

    // Chỉ lấy comment gốc (parentId = null)
    // replies được lấy kèm bên trong mỗi comment
    const comments = await prisma.comment.findMany({
        where: {
            postId,
            parentId: null          // chỉ lấy comment gốc
        },
        include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
            replies: {              // kèm theo replies
                orderBy: { createdAt: "asc" },
                include: {
                    author: { select: { id: true, name: true, email: true, avatar: true } },
                    replies: {          // kèm replies của replies (1 cấp nữa)
                        orderBy: { createdAt: "asc" },
                        include: {
                            author: { select: { id: true, name: true, email: true, avatar: true } }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(comments)
}
