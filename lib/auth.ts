import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { LoginSchema } from "@/lib/validations"
import { redis, checkRateLimit, loginIpLimiter } from "@/lib/ratelimit"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // 1. Kiểm tra IP Rate Limit trước
        const ip = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "anonymous"
        const { limited } = await checkRateLimit(loginIpLimiter, `login_ip:${ip}`)

        if (limited) {
          throw new Error("TOO_MANY_REQUESTS")
        }

        const email = credentials?.email ?? "unknown"
        const lockKey = `login_locked:${email}`
        const failedKey = `login_failed:${email}`

        // Kiểm tra xem tài khoản có đang bị khóa không
        const lockTtl = await redis.ttl(lockKey)
        if (lockTtl > 0) {
          throw new Error("LOCKED_" + Math.ceil(lockTtl / 60))
        }

        const validation = LoginSchema.safeParse(credentials)
        if (!validation.success) {
          throw new Error(validation.error.issues[0].message)
        }

        const user = await prisma.user.findUnique({
          where: { email: validation.data.email }
        })

        if (!user) throw new Error("INVALID_CREDENTIALS")

        const isPasswordCorrect = await bcrypt.compare(
          validation.data.password,
          user.password
        )

        if (!isPasswordCorrect) {
          const attempts = await redis.incr(failedKey)
          if (attempts === 1) await redis.expire(failedKey, 3600) // TTL 1 tiếng cho biến đếm

          if (attempts >= 5) {
            await redis.set(lockKey, "1", { ex: 1800 }) // Khóa 30 phút (1800s)
            await redis.del(failedKey)
          }
          throw new Error("INVALID_CREDENTIALS")
        }

        // Đăng nhập thành công, reset đếm sai
        await redis.del(failedKey)

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.avatar = user.avatar ?? null
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name
        token.avatar = session.user.avatar ?? null
        token.picture = session.user.avatar ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.avatar = token.avatar ?? null
        session.user.image = token.avatar ?? null
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}
