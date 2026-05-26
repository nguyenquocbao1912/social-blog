import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerLimiter, applyRateLimit } from "@/lib/ratelimit"
import { RegisterSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
    // Chặn theo IP
    const ip = request.headers.get("x-forwarded-for")
        ?? request.headers.get("x-real-ip")
        ?? "anonymous"

    const rateLimitRes = await applyRateLimit(registerLimiter, `register:${ip}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json();

    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.issues[0].message },
            { status: 400 }
        )
    }

    const { name, email, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return NextResponse.json(
            { error: "Email already exists" },
            { status: 409 }
        )
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        }
    })

    return NextResponse.json(
        {
            message: "Register successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            }
        },
        { status: 201 }
    )
}