import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { cacheOrFetch, CACHE_TTL, invalidateUserCache } from "@/lib/cache"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkAndAwardBadges, LEVELS } from "@/app/api/monscore/route"

// Helper function to ensure valid numbers
const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  if (!Number.isFinite(num) || isNaN(num)) return defaultValue
  return num
}

// Dashboard API - Com Cache e Rate Limiting
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

    // Rate Limiting - 100 req/min para leitura
    const rateLimitResponse = await checkRateLimit(request, "READ", decoded.id)
    if (rateLimitResponse) return rateLimitResponse

    // Usar cache para dados do dashboard (5 minutos)
    const dashboardData = await cacheOrFetch(
      `user:${decoded.id}:dashboard`,
      async () => {
        console.log("[DASHBOARD] Buscando dados do banco...")
        return await fetchDashboardData(decoded.id)
      },
      { ttl: CACHE_TTL.MEDIUM }
    )

    console.log("[DASHBOARD] ========== FINALIZADO ==========")
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error("DASHBOARD ERROR:", error)
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

// Invalidar cache quando houver mudanças
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Invalida cache do usuário
    await invalidateUserCache(decoded.id)

    return NextResponse.json({ success: true, message: "Cache invalidado" })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao invalidar cache" }, { status: 500 })
  }
}

// Função separada para buscar dados (usada pelo cache)
async function fetchDashboardData(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // ===== BUSCAR TODAS AS TRANSAÇÕES DO USUÁRIO =====
  const allTransactions = await db.transaction.findMany({
    where: { userId },
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
      userId,
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
      userId,
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

  // ===== GASTOS RECORRENTES =====
  const recurringTransactions = await db.recurringTransaction.findMany({
    where: { 
      userId,
      isActive: true 
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      frequency: true,
      nextDueDate: true,
      category: {
        select: { id: true, name: true, icon: true, color: true }
      }
    }
  })

  const monthlyRecurringExpenses = recurringTransactions
    .filter(r => r.type === "EXPENSE" && r.frequency === "MONTHLY")
    .reduce((sum, r) => sum + safeNumber(r.amount), 0)

  const yearlyRecurringExpenses = recurringTransactions
    .filter(r => r.type === "EXPENSE" && r.frequency === "YEARLY")
    .reduce((sum, r) => sum + safeNumber(r.amount) / 12, 0)

  const weeklyRecurringExpenses = recurringTransactions
    .filter(r => r.type === "EXPENSE" && r.frequency === "WEEKLY")
    .reduce((sum, r) => sum + safeNumber(r.amount) * 4.33, 0)

  const totalRecurringMonthly = monthlyRecurringExpenses + yearlyRecurringExpenses + weeklyRecurringExpenses

  console.log(`[DASHBOARD] Gastos recorrentes mensais: R$ ${totalRecurringMonthly.toFixed(2)}`)

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
  const goals = await db.goal.findMany({
    where: { userId },
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

  // ===== MONE SCORE - Calcular dinamicamente =====
  // Recalcular score para garantir que está atualizado
  let totalPoints = 0
  let earnedBadgesCount = 0
  let currentLevel = LEVELS[0]

  try {
    // Verificar e atribuir novas conquistas (igual à página do MonetScore)
    const scoreResult = await checkAndAwardBadges(userId)
    totalPoints = scoreResult.totalPoints

    // Determinar nível baseado nos pontos
    currentLevel = LEVELS.find(l => totalPoints >= l.minScore && totalPoints <= l.maxScore) || LEVELS[0]

    // Contar conquistas do usuário
    earnedBadgesCount = await db.userAchievement.count({
      where: { userId }
    })

    // Score máximo é 1000
    const score = Math.min(totalPoints, 1000)

    // Atualizar usuário com os valores corretos
    await db.user.update({
      where: { id: userId },
      data: {
        financialScore: score,
        totalPoints: totalPoints,
        level: currentLevel.level
      }
    })

    console.log(`[DASHBOARD] Mone Score recalculado: ${score} pts, Nível ${currentLevel.level} (${currentLevel.name})`)
  } catch (e) {
    console.log("[DASHBOARD] Erro ao calcular Mone Score:", e)
  }

  const monScore = {
    score: Math.min(totalPoints, 1000),
    totalPoints,
    level: currentLevel.level,
    levelName: currentLevel.name,
    earnedBadgesCount
  }

  console.log(`[DASHBOARD] Mone Score: ${monScore.score} pts, Nível ${monScore.level} (${monScore.levelName})`)

  return {
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
      currentBalance: safeNumber(a.initialBalance),
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
    monScore,
    recurringExpenses: {
      total: safeNumber(totalRecurringMonthly),
      monthly: safeNumber(monthlyRecurringExpenses),
      yearly: safeNumber(yearlyRecurringExpenses),
      weekly: safeNumber(weeklyRecurringExpenses),
      items: recurringTransactions.filter(r => r.type === "EXPENSE").map(r => ({
        id: r.id,
        description: r.description,
        amount: safeNumber(r.amount),
        frequency: r.frequency,
        nextDueDate: r.nextDueDate,
        category: r.category
      }))
    }
  }
}
