import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

// Helper function to ensure valid numbers
const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  if (!Number.isFinite(num) || isNaN(num)) return defaultValue
  return num
}

// Dashboard API - Usando Prisma ORM (igual ao Calendário que funciona)
export async function GET(request: NextRequest) {
  console.log("[DASHBOARD] ========== INICIANDO ==========")
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      console.log("[DASHBOARD] Erro: token não encontrado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }
    console.log("[DASHBOARD] Usuário:", decoded.id)

    // Data atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // ===== BUSCAR TODAS AS TRANSAÇÕES DO USUÁRIO =====
    const allTransactions = await db.transaction.findMany({
      where: { userId: decoded.id },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        isPaid: true,
        category: {
          select: { id: true, name: true, icon: true, color: true }
        },
        account: {
          select: { id: true, name: true, type: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    console.log(`[DASHBOARD] Total de transações encontradas: ${allTransactions.length}`)

    // ===== CALCULAR TOTAIS =====
    const totalIncome = allTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    const totalExpense = allTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    const monthlyTransactions = allTransactions.filter(t => 
      t.date >= startOfMonth && t.date <= endOfMonth
    )

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    console.log(`[DASHBOARD] ===== RESUMO =====`)
    console.log(`[DASHBOARD] Total Receitas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`[DASHBOARD] Total Despesas: R$ ${totalExpense.toFixed(2)}`)
    console.log(`[DASHBOARD] Receitas do mês: R$ ${monthlyIncome.toFixed(2)}`)
    console.log(`[DASHBOARD] Despesas do mês: R$ ${monthlyExpense.toFixed(2)}`)

    // ===== BUSCAR CONTAS FINANCEIRAS =====
    const accounts = await db.financialAccount.findMany({
      where: { 
        userId: decoded.id,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        type: true,
        initialBalance: true,
        color: true,
        icon: true
      }
    })

    // ===== BUSCAR CARTÕES =====
    const cards = await db.card.findMany({
      where: { 
        userId: decoded.id,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        type: true,
        limit: true,
        brand: true
      }
    })

    // Calcular saldo total
    const initialBalance = accounts.reduce((sum, a) => sum + safeNumber(a.initialBalance), 0)
    const totalBalance = initialBalance + totalIncome - totalExpense

    console.log(`[DASHBOARD] Saldo inicial contas: R$ ${initialBalance.toFixed(2)}`)
    console.log(`[DASHBOARD] Saldo total: R$ ${totalBalance.toFixed(2)}`)

    // ===== DESPESAS POR CATEGORIA (MÊS ATUAL) =====
    const categoryMap = new Map<string, {
      categoryId: string
      categoryName: string
      categoryIcon: string | null
      categoryColor: string | null
      amount: number
    }>()

    monthlyTransactions
      .filter(t => t.type === "EXPENSE" && t.category)
      .forEach(t => {
        const catId = t.category!.id
        const existing = categoryMap.get(catId)
        if (existing) {
          existing.amount += safeNumber(t.amount)
        } else {
          categoryMap.set(catId, {
            categoryId: catId,
            categoryName: t.category!.name,
            categoryIcon: t.category!.icon,
            categoryColor: t.category!.color,
            amount: safeNumber(t.amount)
          })
        }
      })

    const categoryExpenses = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)

    // ===== DADOS MENSAIS (ÚLTIMOS 6 MESES) =====
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthTransactions = allTransactions.filter(t => 
        t.date >= start && t.date <= end
      )

      const income = monthTransactions
        .filter(t => t.type === "INCOME")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0)

      const expense = monthTransactions
        .filter(t => t.type === "EXPENSE")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0)

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income,
        expense
      })
    }

    // ===== METAS =====
    // Buscar todas as metas sem filtro de status (evita erro de tipo no PostgreSQL)
    const goals = await db.goal.findMany({
      where: { userId: decoded.id },
      orderBy: { targetDate: 'asc' },
      take: 5
    })

    const formattedGoals = goals.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: safeNumber(g.targetAmount),
      currentAmount: safeNumber(g.currentAmount),
      progress: safeNumber(g.targetAmount) > 0 
        ? (safeNumber(g.currentAmount) / safeNumber(g.targetAmount)) * 100 
        : 0,
      remaining: safeNumber(g.targetAmount) - safeNumber(g.currentAmount),
      targetDate: g.targetDate
    }))

    // ===== MONE SCORE =====
    // Buscar dados do usuário para o score
    const userData = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        financialScore: true,
        totalPoints: true,
        level: true
      }
    })

    // Contar conquistas do usuário
    let earnedBadgesCount = 0
    try {
      earnedBadgesCount = await db.userAchievement.count({
        where: { userId: decoded.id }
      })
    } catch (e) {
      console.log("[DASHBOARD] Erro ao contar conquistas:", e)
    }

    // Níveis do Mone Score
    const levelNames = ["Iniciante", "Aprendiz", "Intermediário", "Avançado", "Expert", "Mestre"]
    const userLevel = userData?.level || 1

    const monScore = {
      score: userData?.financialScore || 0,
      totalPoints: userData?.totalPoints || 0,
      level: userLevel,
      levelName: levelNames[userLevel - 1] || "Iniciante",
      earnedBadgesCount
    }

    console.log(`[DASHBOARD] Mone Score: ${monScore.score} pts, Nível ${monScore.level} (${monScore.levelName})`)

    console.log("[DASHBOARD] ========== FINALIZADO ==========")

    return NextResponse.json({
      overview: {
        totalBalance: safeNumber(totalBalance),
        monthlyIncome: safeNumber(monthlyIncome),
        monthlyExpense: safeNumber(monthlyExpense),
        monthlyBalance: safeNumber(monthlyIncome - monthlyExpense),
        lastMonthIncome: 0,
        lastMonthExpense: 0,
        incomeChange: 0,
        expenseChange: 0
      },
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        initialBalance: safeNumber(a.initialBalance),
        currentBalance: safeNumber(a.initialBalance), // Para compatibilidade
        color: a.color,
        icon: a.icon
      })),
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        limit: safeNumber(c.limit),
        brand: c.brand
      })),
      recentTransactions: allTransactions.slice(0, 10).map(t => ({
        id: t.id,
        type: t.type,
        amount: safeNumber(t.amount),
        description: t.description,
        date: t.date,
        isPaid: t.isPaid,
        account: t.account,
        category: t.category
      })),
      categoryExpenses,
      monthlyData,
      goals: formattedGoals,
      budgets: [],
      monScore
    })

  } catch (error) {
    console.error("DASHBOARD ERROR:", error)
    // RETORNAR ERRO REAL PARA DEBUG
    return NextResponse.json(
      { 
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
