import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    // Bước 1: Kiểm tra đăng nhập
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return NextResponse.json(
            { error: "Bạn cần đăng nhập để bình luận" },
            { status: 401 }
        )
    }

    // Bước 2: Đọc data
    const body = await request.json()
    const { content, postId, parentId } = body
    // parentId có thì là reply, không có thì là comment gốc

    // Bước 3: Validate
    if (!content || !postId) {
        return NextResponse.json(
            { error: "Thiếu nội dung hoặc bài viết" },
            { status: 400 }
        )
    }

    // Bước 4: Kiểm tra bài viết tồn tại không
    const post = await prisma.post.findUnique({
        where: { id: Number(postId) }
    })

    if (!post) {
        return NextResponse.json(
            { error: "Bài viết không tồn tại" },
            { status: 404 }
        )
    }

    // Bước 5: Nếu là reply, kiểm tra comment cha tồn tại không
    if (parentId) {
        const parentComment = await prisma.comment.findUnique({
            where: { id: Number(parentId) }
        })

        if (!parentComment) {
            return NextResponse.json(
                { error: "Comment cha không tồn tại" },
                { status: 404 }
            )
        }
    }

    // Bước 6: Tạo comment
    const comment = await prisma.comment.create({
        data: {
            content,
            userId: Number(session.user.id),
            postId: Number(postId),
            parentId: parentId ? Number(parentId) : null,
        },
        include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
            replies: {
                include: {
                    author: { select: { id: true, name: true, email: true, avatar: true } }
                }
            }
        }
    })

    return NextResponse.json(comment, { status: 201 })
}
