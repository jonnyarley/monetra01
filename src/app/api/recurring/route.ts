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

// GET - Listar transações recorrentes do usuário
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const recurringTransactions = await db.recurringTransaction.findMany({
      where: { userId: decoded.id },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { nextDueDate: "asc" }
    })

    return NextResponse.json(recurringTransactions)
  } catch (error) {
    console.error("Erro ao buscar transações recorrentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova transação recorrente
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
    const { type, amount, description, categoryId, frequency, dayOfMonth, startDate, endDate, autoCreate, notifyBefore, accountId, cardId } = body

    // Calcular próxima data de vencimento
    const start = new Date(startDate)
    const nextDueDate = new Date(start)
    nextDueDate.setDate(dayOfMonth)

    // Se a data já passou este mês, adiantar para o próximo mês
    const today = new Date()
    if (nextDueDate < today) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }

    const recurringTransaction = await db.recurringTransaction.create({
      data: {
        userId: decoded.id,
        type,
        amount: safeNumber(amount),
        description,
        categoryId: categoryId || null,
        frequency,
        dayOfMonth,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextDueDate,
        autoCreate: autoCreate ?? true,
        notifyBefore: notifyBefore ?? 3,
        accountId: accountId || null,
        cardId: cardId || null
      },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(recurringTransaction, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar transação recorrente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar transação recorrente
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const { id, type, amount, description, categoryId, frequency, dayOfMonth, startDate, endDate, isActive, autoCreate, notifyBefore } = body

    // Verificar se a transação pertence ao usuário
    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    const recurringTransaction = await db.recurringTransaction.update({
      where: { id },
      data: {
        type,
        amount: safeNumber(amount),
        description,
        categoryId: categoryId || null,
        frequency,
        dayOfMonth,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive,
        autoCreate,
        notifyBefore
      },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(recurringTransaction)
  } catch (error) {
    console.error("Erro ao atualizar transação recorrente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover transação recorrente
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
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    // Verificar se a transação pertence ao usuário
    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    await db.recurringTransaction.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar transação recorrente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
