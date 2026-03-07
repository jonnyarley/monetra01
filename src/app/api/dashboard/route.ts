import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

// Dashboard API - Updated for Prisma relation with Category
// GET - Dados do dashboard do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Data atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Buscar dados em paralelo com tratamento de erro
    const [
      accounts,
      cards,
      monthlyIncome,
      monthlyExpense,
      lastMonthIncome,
      lastMonthExpense,
      recentTransactions,
      categoryExpenses,
      goals,
      budgets
    ] = await Promise.all([
      // Contas
      db.financialAccount.findMany({
        where: { userId: decoded.id, isActive: true },
        select: { id: true, name: true, type: true, initialBalance: true, color: true, icon: true }
      }).catch(() => []),

      // Cartões
      db.card.findMany({
        where: { userId: decoded.id, isActive: true },
        select: { id: true, name: true, type: true, limit: true, brand: true }
      }).catch(() => []),

      // Receitas do mês
      db.transaction.aggregate({
        where: { userId: decoded.id, type: "INCOME", date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),

      // Despesas do mês
      db.transaction.aggregate({
        where: { userId: decoded.id, type: "EXPENSE", date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),

      // Receitas do mês passado
      db.transaction.aggregate({
        where: { userId: decoded.id, type: "INCOME", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),

      // Despesas do mês passado
      db.transaction.aggregate({
        where: { userId: decoded.id, type: "EXPENSE", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),

      // Transações recentes
      db.transaction.findMany({
        where: { userId: decoded.id },
        take: 10,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          isPaid: true,
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true, color: true } }
        }
      }).catch(() => []),

      // Despesas por categoria
      db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: decoded.id,
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
          categoryId: { not: null }
        },
        _sum: { amount: true }
      }).catch(() => []),

      // Metas
      db.goal.findMany({
        where: { userId: decoded.id, status: "IN_PROGRESS" },
        take: 5,
        orderBy: { targetDate: 'asc' }
      }).catch(() => []),

      // Orçamentos do mês
      db.budget.findMany({
        where: { userId: decoded.id, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: { select: { id: true, name: true, color: true } } }
      }).catch(() => [])
    ])

    // Calcular saldo total das contas
    let totalBalance = 0
    try {
      for (const account of (accounts as any[])) {
        const income = await db.transaction.aggregate({
          where: { accountId: account.id, type: "INCOME" },
          _sum: { amount: true }
        }).catch(() => ({ _sum: { amount: 0 } }))
        const expense = await db.transaction.aggregate({
          where: { accountId: account.id, type: "EXPENSE" },
          _sum: { amount: true }
        }).catch(() => ({ _sum: { amount: 0 } }))
        totalBalance += (account.initialBalance || 0) + (income._sum.amount || 0) - (expense._sum.amount || 0)
      }
    } catch (e) {
      totalBalance = 0
    }

    // Buscar nomes das categorias
    const categoryIds = (categoryExpenses as any[]).map(c => c.categoryId).filter(Boolean) as string[]
    let categories: any[] = []
    try {
      categories = await db.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, icon: true, color: true }
      })
    } catch (e) {
      categories = []
    }

    const categoryMap = new Map(categories.map(c => [c.id, c]))

    // Formatar despesas por categoria
    const formattedCategoryExpenses = (categoryExpenses as any[]).map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId!)?.name || 'Outros',
      categoryIcon: categoryMap.get(item.categoryId!)?.icon || null,
      categoryColor: categoryMap.get(item.categoryId!)?.color || null,
      amount: item._sum.amount || 0
    })).sort((a, b) => b.amount - a.amount)

    // Dados mensais para gráfico (últimos 6 meses)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const income = await db.transaction.aggregate({
        where: { userId: decoded.id, type: "INCOME", date: { gte: start, lte: end } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } }))

      const expense = await db.transaction.aggregate({
        where: { userId: decoded.id, type: "EXPENSE", date: { gte: start, lte: end } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } }))

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0
      })
    }

    // Formatar metas com progresso
    const formattedGoals = (goals as any[]).map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      remaining: goal.targetAmount - goal.currentAmount
    }))

    return NextResponse.json({
      overview: {
        totalBalance,
        monthlyIncome: (monthlyIncome as any)._sum.amount || 0,
        monthlyExpense: (monthlyExpense as any)._sum.amount || 0,
        monthlyBalance: ((monthlyIncome as any)._sum.amount || 0) - ((monthlyExpense as any)._sum.amount || 0),
        lastMonthIncome: (lastMonthIncome as any)._sum.amount || 0,
        lastMonthExpense: (lastMonthExpense as any)._sum.amount || 0,
        incomeChange: (lastMonthIncome as any)._sum.amount 
          ? (((monthlyIncome as any)._sum.amount || 0) - (lastMonthIncome as any)._sum.amount) / (lastMonthIncome as any)._sum.amount * 100 
          : 0,
        expenseChange: (lastMonthExpense as any)._sum.amount 
          ? (((monthlyExpense as any)._sum.amount || 0) - (lastMonthExpense as any)._sum.amount) / (lastMonthExpense as any)._sum.amount * 100 
          : 0
      },
      accounts,
      cards,
      recentTransactions,
      categoryExpenses: formattedCategoryExpenses,
      monthlyData,
      goals: formattedGoals,
      budgets
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    // Retornar dados vazios em vez de erro
    return NextResponse.json({
      overview: {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlyBalance: 0,
        lastMonthIncome: 0,
        lastMonthExpense: 0,
        incomeChange: 0,
        expenseChange: 0
      },
      accounts: [],
      cards: [],
      recentTransactions: [],
      categoryExpenses: [],
      monthlyData: [],
      goals: [],
      budgets: []
    })
  }
}
