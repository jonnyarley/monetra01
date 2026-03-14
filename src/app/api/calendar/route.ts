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

// GET - Buscar transações para o calendário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")) : null

    // Construir filtro de data
    let dateFilter: { gte: Date; lte: Date }
    
    if (month !== null) {
      // Mês específico
      dateFilter = {
        gte: new Date(year, month, 1),
        lte: new Date(year, month + 1, 0, 23, 59, 59)
      }
    } else {
      // Ano inteiro
      dateFilter = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59)
      }
    }

    // Buscar transações do período
    const transactions = await db.transaction.findMany({
      where: {
        userId: decoded.id,
        date: dateFilter
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        account: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Agrupar por data com validação de números
    const calendarData: Record<string, {
      income: number
      expense: number
      transactions: Array<{
        id: string
        description: string
        amount: number
        type: string
        category: string
        categoryColor: string | null
      }>
    }> = {}

    transactions.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0]
      
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = {
          income: 0,
          expense: 0,
          transactions: []
        }
      }

      const safeAmount = safeNumber(t.amount)
      if (t.type === "INCOME") {
        calendarData[dateKey].income += safeAmount
      } else if (t.type === "EXPENSE") {
        calendarData[dateKey].expense += safeAmount
      }

      calendarData[dateKey].transactions.push({
        id: t.id,
        description: t.description,
        amount: safeAmount,
        type: t.type,
        category: t.category?.name || "Sem categoria",
        categoryColor: t.category?.color || null
      })
    })

    // Calcular totais mensais com validação de números
    const monthlyTotals = []
    for (let m = 0; m < 12; m++) {
      const startOfMonth = new Date(year, m, 1)
      const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59)
      
      const monthTransactions = transactions.filter(t => 
        t.date >= startOfMonth && t.date <= endOfMonth
      )

      const income = safeNumber(monthTransactions
        .filter(t => t.type === "INCOME")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0))
      
      const expense = safeNumber(monthTransactions
        .filter(t => t.type === "EXPENSE")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0))

      monthlyTotals.push({
        month: m,
        monthName: new Date(year, m, 1).toLocaleDateString('pt-BR', { month: 'long' }),
        income,
        expense,
        balance: safeNumber(income - expense)
      })
    }

    // Calcular totais anuais com validação de números
    const yearlyTotals = {
      income: safeNumber(transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + safeNumber(t.amount), 0)),
      expense: safeNumber(transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + safeNumber(t.amount), 0))
    }
    yearlyTotals.balance = safeNumber(yearlyTotals.income - yearlyTotals.expense)

    return NextResponse.json({
      calendarData,
      monthlyTotals,
      yearlyTotals
    })

  } catch (error) {
    console.error("Get calendar error:", error)
    return NextResponse.json({ error: "Erro ao carregar calendário" }, { status: 500 })
  }
}
