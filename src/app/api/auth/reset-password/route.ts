import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirmação de senha é obrigatória")
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, email, password } = result.data

    // Find the reset token
    const resetToken = await db.verificationToken.findFirst({
      where: {
        identifier: `reset-${email.toLowerCase()}`,
        token
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: resetToken.identifier,
            token: resetToken.token
          }
        }
      })
      
      return NextResponse.json(
        { success: false, error: "Token expirado. Solicite um novo link de redefinição." },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: resetToken.identifier,
          token: resetToken.token
        }
      }
    })

    // Delete all auth tokens to force re-login
    // (In production, you might want to delete sessions too)

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso. Faça login com sua nova senha."
    })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}
