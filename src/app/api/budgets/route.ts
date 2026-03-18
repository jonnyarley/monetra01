import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

// Budget API - Updated for Prisma relation with Category

const createBudgetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  categoryId: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo"),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  alerts: z.boolean().default(true),
  alertThreshold: z.number().min(1).max(100).default(80),
})

// GET - Listar orçamentos do usuário
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
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear()

    const budgets = await db.budget.findMany({
      where: { 
        userId: decoded.id,
        OR: [
          { month, year },
          { period: "YEARLY", year }
        ]
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } }
      },
      orderBy: { name: 'asc' }
    })

    // Calcular gasto atual de cada orçamento
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const where: {
          userId: string
          type: string
          date: { gte: Date; lte: Date }
          categoryId?: string
        } = {
          userId: decoded.id,
          type: "EXPENSE",
          date: { gte: startDate, lte: endDate }
        }

        if (budget.categoryId) {
          where.categoryId = budget.categoryId
        }

        const spent = await db.transaction.aggregate({
          where,
          _sum: { amount: true }
        })

        const spentAmount = spent._sum.amount || 0
        const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0

        return {
          ...budget,
          spent: spentAmount,
          remaining: budget.amount - spentAmount,
          percentage: Math.min(percentage, 100),
          isOverBudget: spentAmount > budget.amount,
          isNearLimit: percentage >= (budget.alertThreshold || 80)
        }
      })
    )

    return NextResponse.json({ budgets: budgetsWithSpent })
  } catch (error) {
    console.error("Get budgets error:", error)
    return NextResponse.json({ error: "Erro ao carregar orçamentos" }, { status: 500 })
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const result = createBudgetSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const data = result.data

    // Verificar se já existe orçamento para a mesma categoria/mês
    const existing = await db.budget.findFirst({
      where: {
        userId: decoded.id,
        categoryId: data.categoryId || null,
        month: data.month,
        year: data.year,
        period: data.period
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Já existe um orçamento para esta categoria/período" }, { status: 400 })
    }

    const budget = await db.budget.create({
      data: {
        userId: decoded.id,
        name: data.name,
        categoryId: data.categoryId || null,
        amount: data.amount,
        spent: 0,
        period: data.period,
        month: data.month,
        year: data.year,
        alerts: data.alerts ?? true,
        alertThreshold: data.alertThreshold || 80,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } }
      }
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error("Create budget error:", error)
    return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 })
  }
}

// PATCH - Atualizar orçamento
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const budget = await db.budget.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!budget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    const updated = await db.budget.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } }
      }
    })

    return NextResponse.json({ budget: updated })
  } catch (error) {
    console.error("Update budget error:", error)
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 })
  }
}

// DELETE - Remover orçamento
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const budget = await db.budget.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!budget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    await db.budget.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete budget error:", error)
    return NextResponse.json({ error: "Erro ao excluir orçamento" }, { status: 500 })
  }
}
