import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

// API temporária para debug - REMOVER EM PRODUÇÃO
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  const testPassword = searchParams.get("password") || "32415466"
  
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
        message: "❌ Usuário NÃO encontrado no banco de dados",
        email: email.toLowerCase()
      })
    }

    // Testar senha
    let passwordTest = null
    if (user.password) {
      // Testar se a senha está hasheada (bcrypt começa com $2a$, $2b$, etc)
      const isHashed = user.password.startsWith('$2')
      
      // Testar comparação com bcrypt
      const bcryptMatch = await compare(testPassword, user.password)
      
      // Testar comparação direta (senha sem hash)
      const directMatch = user.password === testPassword
      
      passwordTest = {
        isHashed,
        bcryptMatch,
        directMatch,
        testPasswordLength: testPassword.length,
        storedPasswordLength: user.password.length,
        storedPasswordPreview: user.password.substring(0, 30) + "..."
      }
    }

    // Buscar tokens de reset
    const resetTokens = await db.verificationToken.findMany({
      where: { identifier: `reset-${email.toLowerCase()}` },
      select: { token: true, expires: true }
    })

    return NextResponse.json({ 
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        hasPassword: !!user.password,
        trialEndsAt: user.trialEndsAt,
        trialExpired: user.trialEndsAt ? new Date() > user.trialEndsAt : false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      passwordTest,
      resetTokens: resetTokens.map(t => ({
        token: t.token.substring(0, 10) + "...",
        expires: t.expires,
        expired: new Date() > t.expires
      })),
      recommendation: getPasswordRecommendation(passwordTest)
    })

  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: "Erro ao buscar usuário",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function getPasswordRecommendation(test: any): string {
  if (!test) return "❌ Usuário não tem senha cadastrada!"
  if (test.bcryptMatch) return "✅ Senha correta! O login deveria funcionar."
  if (test.directMatch) return "⚠️ Senha está salva SEM hash! Vou corrigir automaticamente."
  return "❌ Senha incorreta. Use 'Esqueceu a senha?' para redefinir."
}
