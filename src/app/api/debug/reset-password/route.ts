import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

// API para redefinir senha diretamente (admin) - REMOVER EM PRODUÇÃO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword, secretKey } = body

    // Segurança simples - em produção usar autenticação real
    if (secretKey !== "monetra-debug-2024") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    if (!email || !newPassword) {
      return NextResponse.json({ 
        error: "Email e nova senha são obrigatórios" 
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "Senha deve ter pelo menos 6 caracteres" 
      }, { status: 400 })
    }

    // Verificar se usuário existe
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ 
        error: "Usuário não encontrado" 
      }, { status: 404 })
    }

    // Hash da nova senha
    const hashedPassword = await hash(newPassword, 12)

    // Atualizar senha
    await db.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ 
      success: true,
      message: `Senha redefinida com sucesso para ${email}`,
      newPasswordSet: true
    })

  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json({ 
      error: "Erro ao redefinir senha",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
