import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

// Helper function to ensure valid numbers
const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  if (!Number.isFinite(num) || isNaN(num)) return defaultValue
  return num
}

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string(),
  accountId: z.string().optional(),
  cardId: z.string().optional(),
  categoryId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  isInstallment: z.boolean().default(false),
  installmentTotal: z.number().optional(),
  installmentCurrent: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean().default(true),
})

// GET - Listar transações do usuário
export async function GET(request: NextRequest) {
  console.log("[TRANSACTIONS] ========== INICIANDO ==========")
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const type = searchParams.get("type")
    const accountId = searchParams.get("accountId")
    const cardId = searchParams.get("cardId")
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Construir filtros
    const where: {
      userId: string
      type?: string
      accountId?: string | null
      cardId?: string | null
      categoryId?: string | null
      date?: { gte?: Date; lte?: Date }
      OR?: Array<{ description?: { contains: string; mode: 'insensitive' }; notes?: { contains: string; mode: 'insensitive' } }>
    } = { userId: decoded.id }

    if (type && type !== "all") where.type = type
    if (accountId && accountId !== "all") where.accountId = accountId
    if (cardId && cardId !== "all") where.cardId = cardId
    if (categoryId && categoryId !== "all") where.categoryId = categoryId

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Buscar transações usando Prisma ORM
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          account: { select: { id: true, name: true, type: true } },
          card: { select: { id: true, name: true, brand: true } },
          category: { select: { id: true, name: true, icon: true, color: true } },
        }
      }),
      db.transaction.count({ where })
    ])

    console.log(`[TRANSACTIONS] Encontradas: ${transactions.length} transações`)

    // Buscar TODAS as transações para calcular totais (sem paginação)
    const allTransactions = await db.transaction.findMany({
      where: { userId: decoded.id },
      select: { type: true, amount: true }
    })

    // Calcular totais usando JavaScript
    const totalIncome = allTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    const totalExpense = allTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0)

    console.log(`[TRANSACTIONS] Total Receitas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`[TRANSACTIONS] Total Despesas: R$ ${totalExpense.toFixed(2)}`)
    console.log("[TRANSACTIONS] ========== FINALIZADO ==========")

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: allTransactions.length
      }
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Erro ao carregar transações" }, { status: 500 })
  }
}

// POST - Criar nova transação
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
    const result = createTransactionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const data = result.data

    const transaction = await db.transaction.create({
      data: {
        userId: decoded.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        accountId: data.accountId || null,
        cardId: data.cardId || null,
        categoryId: data.categoryId || null,
        isRecurring: data.isRecurring || false,
        recurringPeriod: data.recurringPeriod || null,
        isInstallment: data.isInstallment || false,
        installmentTotal: data.installmentTotal || null,
        installmentCurrent: data.installmentCurrent || null,
        location: data.location || null,
        notes: data.notes || null,
        isPaid: data.isPaid ?? true,
      },
      include: {
        account: { select: { id: true, name: true } },
        card: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 })
  }
}

// PATCH - Atualizar transação
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

    const transaction = await db.transaction.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
    if (data.date) updateData.date = new Date(data.date)

    const updated = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: { select: { id: true, name: true } },
        card: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json({ transaction: updated })
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 })
  }
}

// DELETE - Remover transação
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

    const transaction = await db.transaction.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    await db.transaction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 })
  }
}
