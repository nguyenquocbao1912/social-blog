import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const comment = await prisma.comment.findUnique({
        where: { id: Number(id) }
    })

    if (!comment) {
        return NextResponse.json(
            { error: "Comment không tồn tại" },
            { status: 404 }
        )
    }

    // Chỉ tác giả comment mới được xóa
    if (comment.userId !== Number(session.user.id)) {
        return NextResponse.json(
            { error: "Bạn không có quyền xóa comment này" },
            { status: 403 }
        )
    }

    // Xóa comment — replies sẽ tự xóa theo nếu setup cascade
    await prisma.comment.delete({
        where: { id: Number(id) }
    })

    return NextResponse.json({ message: "Đã xóa comment" })
}