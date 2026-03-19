import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { invalidateUserCache } from "@/lib/cache"

// API para limpar todos os dados financeiros do usuário logado
export async function POST(request: NextRequest) {
  console.log("[CLEAR-DATA] ========== INICIANDO ==========")
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }
    console.log("[CLEAR-DATA] Usuário:", decoded.id)

    // Contar dados antes de apagar
    const beforeCounts = {
      transactions: await db.transaction.count({ where: { userId: decoded.id } }),
      recurringTransactions: await db.recurringTransaction.count({ where: { userId: decoded.id } }),
      goals: await db.goal.count({ where: { userId: decoded.id } }),
      budgets: await db.budget.count({ where: { userId: decoded.id } }),
      categories: await db.category.count({ where: { userId: decoded.id } }),
      accounts: await db.financialAccount.count({ where: { userId: decoded.id } }),
      cards: await db.card.count({ where: { userId: decoded.id } }),
      reminders: await db.billReminder.count({ where: { userId: decoded.id } }),
      exports: await db.exportHistory.count({ where: { userId: decoded.id } }),
    }

    console.log("[CLEAR-DATA] Dados antes:", beforeCounts)

    // Apagar dados em ordem (respeitando foreign keys)
    
    // 1. Transações
    const deletedTransactions = await db.transaction.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Transações apagadas: ${deletedTransactions.count}`)

    // 2. Transações recorrentes
    const deletedRecurring = await db.recurringTransaction.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Recorrentes apagadas: ${deletedRecurring.count}`)

    // 3. Metas
    const deletedGoals = await db.goal.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Metas apagadas: ${deletedGoals.count}`)

    // 4. Orçamentos
    const deletedBudgets = await db.budget.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Orçamentos apagados: ${deletedBudgets.count}`)

    // 5. Lembretes
    const deletedReminders = await db.billReminder.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Lembretes apagados: ${deletedReminders.count}`)

    // 6. Histórico de exportação
    const deletedExports = await db.exportHistory.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Exportações apagadas: ${deletedExports.count}`)

    // 7. Categorias personalizadas (não padrão)
    const deletedCategories = await db.category.deleteMany({
      where: { 
        userId: decoded.id,
        isDefault: false 
      }
    })
    console.log(`[CLEAR-DATA] Categorias apagadas: ${deletedCategories.count}`)

    // 8. Contas financeiras
    const deletedAccounts = await db.financialAccount.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Contas apagadas: ${deletedAccounts.count}`)

    // 9. Cartões
    const deletedCards = await db.card.deleteMany({
      where: { userId: decoded.id }
    })
    console.log(`[CLEAR-DATA] Cartões apagados: ${deletedCards.count}`)

    // Invalidar cache
    await invalidateUserCache(decoded.id)

    // Resetar score do usuário (opcional)
    await db.user.update({
      where: { id: decoded.id },
      data: {
        financialScore: 0,
        totalPoints: 0,
        level: 1
      }
    })
    console.log("[CLEAR-DATA] Score resetado")

    console.log("[CLEAR-DATA] ========== FINALIZADO ==========")

    return NextResponse.json({
      success: true,
      message: "Todos os dados foram apagados com sucesso!",
      deleted: {
        transactions: deletedTransactions.count,
        recurringTransactions: deletedRecurring.count,
        goals: deletedGoals.count,
        budgets: deletedBudgets.count,
        categories: deletedCategories.count,
        accounts: deletedAccounts.count,
        cards: deletedCards.count,
        reminders: deletedReminders.count,
        exports: deletedExports.count,
      }
    })

  } catch (error) {
    console.error("[CLEAR-DATA] Erro:", error)
    return NextResponse.json({ 
      error: "Erro ao apagar dados",
      details: String(error)
    }, { status: 500 })
  }
}

// GET para ver quantidade de dados
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const counts = {
      transactions: await db.transaction.count({ where: { userId: decoded.id } }),
      recurringTransactions: await db.recurringTransaction.count({ where: { userId: decoded.id } }),
      goals: await db.goal.count({ where: { userId: decoded.id } }),
      budgets: await db.budget.count({ where: { userId: decoded.id } }),
      categories: await db.category.count({ where: { userId: decoded.id } }),
      accounts: await db.financialAccount.count({ where: { userId: decoded.id } }),
      cards: await db.card.count({ where: { userId: decoded.id } }),
      reminders: await db.billReminder.count({ where: { userId: decoded.id } }),
      exports: await db.exportHistory.count({ where: { userId: decoded.id } }),
    }

    return NextResponse.json({
      userId: decoded.id,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0)
    })

  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
