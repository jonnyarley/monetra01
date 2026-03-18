import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"

// API de debug para login e reset de senha
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 })
  }

  try {
    // Buscar campos básicos que sempre existem
    const user = await db.$queryRaw`
      SELECT id, email, name, plan, password, "createdAt"
      FROM users
      WHERE email = ${email.toLowerCase()}
    ` as any[]

    if (!user || user.length === 0) {
      return NextResponse.json({
        exists: false,
        message: "❌ Usuário NÃO encontrado",
        email: email.toLowerCase()
      })
    }

    const u = user[0]

    return NextResponse.json({
      exists: true,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        hasPassword: !!u.password,
        createdAt: u.createdAt
      },
      passwordInfo: u.password ? {
        length: u.password.length,
        isHashed: u.password.startsWith('$2'),
        preview: u.password.substring(0, 20) + "..."
      } : null
    })

  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      error: "Erro no debug",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword, key } = body

    if (key !== "monetra-reset-2024") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    if (!email || !newPassword || newPassword.length < 6) {
      return NextResponse.json({
        error: "Email e senha (min 6 caracteres) obrigatórios"
      }, { status: 400 })
    }

    const hashedPassword = await hash(newPassword, 12)

    // Atualizar usando query raw para evitar problemas com campos que não existem
    await db.$executeRaw`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE email = ${email.toLowerCase()}
    `

    return NextResponse.json({
      success: true,
      message: `✅ Senha redefinida para ${email}`,
      newPassword: newPassword
    })

  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json({
      error: "Erro ao redefinir",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
