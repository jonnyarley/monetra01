import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import { ADMIN_CONFIG } from "@/lib/admin-config"
import { getAdminJwtSecret } from "@/lib/jwt-secret"

// Rate limiting store (in-memory, para produção use Redis)
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
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  // Check if limit exceeded
  if (attempts.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  // Increment attempts
  attempts.count++
  attempts.lastAttempt = now
  return false
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

// Delay para prevenir timing attacks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Obter IP do cliente
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    // Verificar rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const { email, password } = body

    // Validar campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Verificar email
    if (emailLower !== ADMIN_CONFIG.email.toLowerCase()) {
      await delay(500 + Math.random() * 500)
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Verificar senha com bcrypt
    const passwordMatch = await compare(password, ADMIN_CONFIG.passwordHash)
    
    if (!passwordMatch) {
      await delay(500 + Math.random() * 500)
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Sucesso - limpar rate limit
    clearRateLimit(ip)

    // Gerar JWT token seguro
    const jwtSecret = getAdminJwtSecret()

    const token = sign(
      { 
        email: ADMIN_CONFIG.email, 
        role: "admin",
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: "24h",
        algorithm: "HS256"
      }
    )

    // Definir cookie seguro
    const cookieStore = await cookies()
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/"
    })

    return NextResponse.json({
      success: true,
      admin: {
        email: ADMIN_CONFIG.email,
        name: "Jonny Arley",
        role: "admin"
      }
    })

  } catch (error) {
    console.error("Admin auth error:", error)
    
    // Garantir tempo mínimo de resposta para prevenir timing attacks
    const elapsed = Date.now() - startTime
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
