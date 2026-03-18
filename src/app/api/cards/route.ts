import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

const createCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["CREDIT", "DEBIT", "PREPAID"]),
  brand: z.string().optional(),
  lastDigits: z.string().length(4).optional(),
  limit: z.number().default(0),
  closingDay: z.number().min(1).max(31).default(10),
  dueDay: z.number().min(1).max(31).default(15),
  color: z.string().optional(),
})

// GET - Listar cartões do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const cards = await db.card.findMany({
      where: { userId: decoded.id, isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { transactions: true } }
      }
    })

    // Calcular limite usado
    const cardsWithUsage = await Promise.all(
      cards.map(async (card) => {
        const used = await db.transaction.aggregate({
          where: { 
            cardId: card.id, 
            type: "EXPENSE",
            date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          },
          _sum: { amount: true }
        })

        return {
          ...card,
          usedLimit: used._sum.amount || 0,
          availableLimit: card.limit - (used._sum.amount || 0),
          transactionCount: card._count.transactions
        }
      })
    )

    return NextResponse.json({ cards: cardsWithUsage })
  } catch (error) {
    console.error("Get cards error:", error)
    return NextResponse.json({ error: "Erro ao carregar cartões" }, { status: 500 })
  }
}

// POST - Criar novo cartão
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
    const result = createCardSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const { name, type, brand, lastDigits, limit, closingDay, dueDay, color } = result.data

    const card = await db.card.create({
      data: {
        userId: decoded.id,
        name,
        type,
        brand: brand || null,
        lastDigits: lastDigits || null,
        limit: limit || 0,
        usedLimit: 0,
        closingDay: closingDay || 10,
        dueDay: dueDay || 15,
        color: color || null,
        isActive: true,
      }
    })

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error("Create card error:", error)
    return NextResponse.json({ error: "Erro ao criar cartão" }, { status: 500 })
  }
}

// PATCH - Atualizar cartão
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

    const card = await db.card.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!card) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    const updated = await db.card.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })

    return NextResponse.json({ card: updated })
  } catch (error) {
    console.error("Update card error:", error)
    return NextResponse.json({ error: "Erro ao atualizar cartão" }, { status: 500 })
  }
}

// DELETE - Remover cartão (soft delete)
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

    const card = await db.card.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!card) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    await db.card.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete card error:", error)
    return NextResponse.json({ error: "Erro ao excluir cartão" }, { status: 500 })
  }
}
