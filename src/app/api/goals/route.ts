import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

const createGoalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  targetAmount: z.number().positive("Valor alvo deve ser positivo"),
  currentAmount: z.number().default(0),
  targetDate: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

// GET - Listar metas do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const goals = await db.goal.findMany({
      where: { userId: decoded.id },
      orderBy: [
        { status: 'asc' },
        { targetDate: 'asc' }
      ],
    })

    // Calcular progresso
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0 
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0,
      remaining: goal.targetAmount - goal.currentAmount,
      daysRemaining: goal.targetDate 
        ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    }))

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error("Get goals error:", error)
    return NextResponse.json({ error: "Erro ao carregar metas" }, { status: 500 })
  }
}

// POST - Criar nova meta
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
    const result = createGoalSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const data = result.data

    const goal = await db.goal.create({
      data: {
        userId: decoded.id,
        name: data.name,
        description: data.description || null,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        category: data.category || null,
        color: data.color || null,
        icon: data.icon || null,
        status: "IN_PROGRESS",
      }
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error("Create goal error:", error)
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 })
  }
}

// PATCH - Atualizar meta
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

    const goal = await db.goal.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    // Verificar se a meta foi atingida
    let status = goal.status
    if (data.currentAmount !== undefined && data.currentAmount >= goal.targetAmount) {
      status = "COMPLETED"
    }

    const updateData: Record<string, unknown> = { ...data, status }
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate)

    const updated = await db.goal.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ goal: updated })
  } catch (error) {
    console.error("Update goal error:", error)
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 })
  }
}

// DELETE - Remover meta
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

    const goal = await db.goal.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    await db.goal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete goal error:", error)
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 })
  }
}
