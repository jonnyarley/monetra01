import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { randomBytes } from "crypto"
import { sendEmail, getPasswordResetEmailTemplate } from "@/lib/email"

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

    // Generate reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000"
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    
    console.log("=".repeat(60))
    console.log("PASSWORD RESET REQUEST")
    console.log("Email:", email)
    console.log("Reset URL:", resetUrl)
    console.log("=".repeat(60))

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: "Redefinir sua senha - Monex",
      html: getPasswordResetEmailTemplate(resetUrl, user.name)
    })

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error)
      // Still return success to not reveal if email exists
    }

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      // Sempre retornar o link para desenvolvimento/teste
      devToken: token,
      devResetUrl: resetUrl
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}
