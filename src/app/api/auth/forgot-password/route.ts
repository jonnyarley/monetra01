import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { randomBytes } from "crypto"

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido")
})

// Rate limiting
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 60000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = resetAttempts.get(ip)
  
  if (!attempts) {
    resetAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    resetAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (attempts.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

export async function POST(request: NextRequest) {
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
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá instruções para redefinir sua senha."
      })
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: `reset-${email.toLowerCase()}` }
    })

    // Save token
    await db.verificationToken.create({
      data: {
        identifier: `reset-${email.toLowerCase()}`,
        token,
        expires
      }
    })

    // In production, send email here
    // For now, log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    
    console.log("=".repeat(60))
    console.log("PASSWORD RESET LINK (dev mode):")
    console.log(resetUrl)
    console.log("=".repeat(60))

    // TODO: Send email with Resend or similar service
    // Example:
    // await sendEmail({
    //   to: email,
    //   subject: "Redefinir senha - Monetra",
    //   html: `<a href="${resetUrl}">Clique aqui para redefinir sua senha</a>`
    // })

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      // In development, return the token for testing
      ...(process.env.NODE_ENV === "development" && { 
        devToken: token,
        devResetUrl: resetUrl
      })
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}
