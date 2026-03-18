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

// GET - Listar lembretes do usuário
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const reminders = await db.billReminder.findMany({
      where: { userId: decoded.id },
      orderBy: { dueDate: "asc" }
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error("Erro ao buscar lembretes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo lembrete
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
    const { name, amount, dueDate, category, remindDays, isRecurring, recurringPeriod, notes } = body

    const reminder = await db.billReminder.create({
      data: {
        userId: decoded.id,
        name,
        amount: safeNumber(amount),
        dueDate: new Date(dueDate),
        category: category || null,
        remindDays: remindDays ?? 3,
        isRecurring: isRecurring ?? false,
        recurringPeriod: recurringPeriod || null,
        notes: notes || null
      }
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar lembrete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar lembrete
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
    const { id, name, amount, dueDate, category, remindDays, isRecurring, recurringPeriod, isPaid, notes } = body

    // Verificar se o lembrete pertence ao usuário
    const existing = await db.billReminder.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 })
    }

    const reminder = await db.billReminder.update({
      where: { id },
      data: {
        name,
        amount: safeNumber(amount),
        dueDate: new Date(dueDate),
        category: category || null,
        remindDays,
        isRecurring,
        recurringPeriod: recurringPeriod || null,
        isPaid: isPaid ?? false,
        paidAt: isPaid ? new Date() : null,
        notes: notes || null
      }
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover lembrete
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

    // Verificar se o lembrete pertence ao usuário
    const existing = await db.billReminder.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 })
    }

    await db.billReminder.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar lembrete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
