import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

// Rate limiting store
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "5")
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000")

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (attempts.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.password) {
      await delay(500 + Math.random() * 500)
      return NextResponse.json(
        { success: false, error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      await delay(500 + Math.random() * 500)
      return NextResponse.json(
        { success: false, error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    // Success - clear rate limit
    clearRateLimit(ip)

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Generate JWT token
    const jwtSecret = getJwtSecret()

    const token = sign(
      { 
        id: user.id,
        email: user.email,
        plan: user.plan,
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: "30d",
        algorithm: "HS256"
      }
    )

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/"
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan,
        currency: user.currency,
        language: user.language,
        theme: user.theme,
        financialScore: user.financialScore,
        totalPoints: user.totalPoints,
        level: user.level
      }
    })

  } catch (error) {
    console.error("Login error:", error)
    
    const elapsed = Date.now() - startTime
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    
    return NextResponse.json(
      { success: false, error: "Erro ao fazer login" },
      { status: 500 }
    )
  }
}
