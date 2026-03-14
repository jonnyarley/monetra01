import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getAdminJwtSecret } from "@/lib/jwt-secret"

// Helper para deletar com segurança (ignora se tabela não existir)
async function safeDelete(deleteFn: () => Promise<{ count: number }>): Promise<number> {
  try {
    const result = await deleteFn()
    return result.count
  } catch (error: any) {
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      console.log("Tabela não existe, ignorando...")
      return 0
    }
    throw error
  }
}

// POST - Limpar todos os dados de todos os usuários
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Verificar token de admin
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken) {
      return NextResponse.json({ error: "Não autorizado - faça login como admin" }, { status: 401 })
    }

    const jwtSecret = getAdminJwtSecret()
    
    let decoded: any
    try {
      decoded = verify(adminToken, jwtSecret)
    } catch (e) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
    }

    // Verificar se é admin
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar confirmação
    const body = await request.json().catch(() => ({}))
    const confirmation = body.confirmation

    if (confirmation !== "APAGAR_TUDO") {
      return NextResponse.json({ 
        error: "Confirmação necessária. Envie { confirmation: 'APAGAR_TUDO' }" 
      }, { status: 400 })
    }

    console.log(`[ADMIN] Iniciando limpeza completa dos dados...`)

    // Deletar na ordem correta (respeitando foreign keys)
    const results: Record<string, number> = {}

    // Deletar em ordem segura
    const deletions = [
      { name: "transactionTags", fn: () => db.transactionTag.deleteMany({}) },
      { name: "transactions", fn: () => db.transaction.deleteMany({}) },
      { name: "recurringTransactions", fn: () => db.recurringTransaction.deleteMany({}) },
      { name: "billReminders", fn: () => db.billReminder.deleteMany({}) },
      { name: "budgets", fn: () => db.budget.deleteMany({}) },
      { name: "goals", fn: () => db.goal.deleteMany({}) },
      { name: "familyGoalContributions", fn: () => db.familyGoalContribution.deleteMany({}) },
      { name: "familyGoals", fn: () => db.familyGoal.deleteMany({}) },
      { name: "familyMembers", fn: () => db.familyMember.deleteMany({}) },
      { name: "families", fn: () => db.family.deleteMany({}) },
      { name: "userAchievements", fn: () => db.userAchievement.deleteMany({}) },
      { name: "exportHistory", fn: () => db.exportHistory.deleteMany({}) },
      { name: "reports", fn: () => db.report.deleteMany({}) },
      { name: "bankConnections", fn: () => db.bankConnection.deleteMany({}) },
      { name: "notifications", fn: () => db.notification.deleteMany({}) },
      { name: "auditLogs", fn: () => db.auditLog.deleteMany({}) },
      { name: "onboardingProgress", fn: () => db.onboardingProgress.deleteMany({}) },
      { name: "cards", fn: () => db.card.deleteMany({}) },
      { name: "financialAccounts", fn: () => db.financialAccount.deleteMany({}) },
      { name: "tags", fn: () => db.tag.deleteMany({}) },
      { name: "categoriesCustom", fn: () => db.category.deleteMany({ where: { isDefault: false } }) },
      { name: "sessions", fn: () => db.session.deleteMany({}) },
      { name: "accounts", fn: () => db.account.deleteMany({}) },
    ]

    for (const { name, fn } of deletions) {
      try {
        const count = await safeDelete(fn)
        results[name] = count
        console.log(`[ADMIN] ${name}: ${count} registros deletados`)
      } catch (error) {
        console.error(`[ADMIN] Erro ao deletar ${name}:`, error)
        results[name] = -1 // erro
      }
    }

    // Resetar pontuação dos usuários
    try {
      await db.user.updateMany({
        data: {
          financialScore: 0,
          totalPoints: 0,
          level: 1
        }
      })
      console.log(`[ADMIN] Scores dos usuários resetados`)
      results["usersReset"] = 1
    } catch (error) {
      console.error(`[ADMIN] Erro ao resetar usuários:`, error)
      results["usersReset"] = -1
    }

    console.log(`[ADMIN] Limpeza completa finalizada!`)

    return NextResponse.json({
      success: true,
      message: "Limpeza concluída!",
      deleted: results,
      note: "Usuários e categorias padrão foram mantidos. -1 indica erro na tabela."
    })

  } catch (error) {
    console.error("[ADMIN] Erro ao limpar dados:", error)
    return NextResponse.json({ 
      error: "Erro ao limpar dados", 
      details: String(error) 
    }, { status: 500 })
  }
}

// GET - Endpoint para testar se a rota está funcionando
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Endpoint para limpar todos os dados. Use POST com { confirmation: 'APAGAR_TUDO' }",
    warning: "ESTA AÇÃO É IRREVERSÍVEL!"
  })
}
