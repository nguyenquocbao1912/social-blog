import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Đăng ký — chặn theo IP
export const registerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, "30 m"),
  prefix: "rl:register",
})

// Đăng nhập — chặn theo IP (15 request / 30 phút)
export const loginIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "30 m"),
  prefix: "rl:login_ip",
})


export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, remaining, reset } = await limiter.limit(identifier)
  return { limited: !success, remaining, reset }
}

// Helper dùng trong Route Handler
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  const { limited, reset } = await checkRateLimit(limiter, identifier)
  if (!limited) return null

  const minutesLeft = Math.ceil((reset - Date.now()) / 1000 / 60)

  return NextResponse.json(
    { error: `Too many requests. Please try again after ${minutesLeft} minutes!` },
    { status: 429 }
  )
}