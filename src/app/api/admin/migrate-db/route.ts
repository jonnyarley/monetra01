import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { execSync } from "child_process"

// API de admin para sincronizar banco de dados - Apenas em desenvolvimento ou com chave secreta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, secretKey } = body

    // Segurança - requer chave secreta
    if (secretKey !== "monetra-admin-2024") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Ação 1: Sincronizar schema do banco
    if (action === "sync-db") {
      try {
        // Executar prisma db push
        const result = execSync("npx prisma db push --accept-data-loss --skip-generate", {
          encoding: "utf-8",
          timeout: 60000,
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL
          }
        })

        return NextResponse.json({
          success: true,
          message: "Banco de dados sincronizado com sucesso!",
          output: result
        })
      } catch (syncError) {
        console.error("Sync error:", syncError)
        return NextResponse.json({
          success: false,
          error: "Erro ao sincronizar banco",
          details: syncError instanceof Error ? syncError.message : "Unknown error"
        }, { status: 500 })
      }
    }

    // Ação 2: Resetar senha de usuário
    if (action === "reset-password") {
      const { email, newPassword } = body

      if (!email || !newPassword) {
        return NextResponse.json({
          error: "Email e nova senha são obrigatórios"
        }, { status: 400 })
      }

      // Verificar se usuário existe
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, name: true }
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
        message: `Senha redefinida para ${email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    }

    return NextResponse.json({
      error: "Ação inválida. Use 'sync-db' ou 'reset-password'"
    }, { status: 400 })

  } catch (error) {
    console.error("Admin error:", error)
    return NextResponse.json({
      error: "Erro interno",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
