import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { getPlanLimits, checkLimit } from "@/lib/plans"

// GET - Verificar limites do plano atual
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Buscar usuário com plano
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: { plan: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const limits = getPlanLimits(user.plan)

    // Contar itens atuais do usuário
    const [
      transactionCount,
      accountCount,
      cardCount,
      goalCount,
      budgetCount,
      categoryCount,
      tagCount
    ] = await Promise.all([
      // Transações do mês atual
      db.transaction.count({
        where: {
          userId: decoded.id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        }
      }),
      db.financialAccount.count({ where: { userId: decoded.id, isActive: true } }),
      db.card.count({ where: { userId: decoded.id, isActive: true } }),
      db.goal.count({ where: { userId: decoded.id, status: "IN_PROGRESS" } }),
      db.budget.count({ where: { userId: decoded.id } }),
      db.category.count({ where: { userId: decoded.id } }),
      db.tag.count({ where: { userId: decoded.id } })
    ])

    // Verificar cada limite
    const checks = {
      transactions: checkLimit(user.plan, "transactionsPerMonth", transactionCount),
      accounts: checkLimit(user.plan, "maxAccounts", accountCount),
      cards: checkLimit(user.plan, "maxCards", cardCount),
      goals: checkLimit(user.plan, "maxGoals", goalCount),
      budgets: checkLimit(user.plan, "maxBudgets", budgetCount),
      categories: checkLimit(user.plan, "maxCategories", categoryCount),
      tags: checkLimit(user.plan, "maxTags", tagCount),
    }

    return NextResponse.json({
      plan: user.plan,
      limits,
      current: {
        transactionsThisMonth: transactionCount,
        accounts: accountCount,
        cards: cardCount,
        goals: goalCount,
        budgets: budgetCount,
        categories: categoryCount,
        tags: tagCount,
      },
      checks,
    })

  } catch (error) {
    console.error("Get limits error:", error)
    return NextResponse.json({ error: "Erro ao verificar limites" }, { status: 500 })
  }
}
