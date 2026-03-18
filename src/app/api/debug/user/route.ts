import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// API temporária para debug - REMOVER EM PRODUÇÃO
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  
  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
  }

  try {
    // Buscar usuário pelo email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        plan: true,
        trialEndsAt: true,
        trialUsed: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: "Usuário NÃO encontrado no banco de dados",
        email: email.toLowerCase()
      })
    }

    return NextResponse.json({ 
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0,
        passwordHash: user.password?.substring(0, 20) + "...",
        trialEndsAt: user.trialEndsAt,
        trialUsed: user.trialUsed,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      message: "Usuário encontrado! Verifique se a senha está correta."
    })

  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: "Erro ao buscar usuário",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
