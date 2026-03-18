import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

const createAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "WALLET", "OTHER"]),
  balance: z.number().default(0),
  initialBalance: z.number().default(0),
  currency: z.string().default("BRL"),
  color: z.string().optional(),
  icon: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
})

// GET - Listar contas do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const accounts = await db.financialAccount.findMany({
      where: { userId: decoded.id, isActive: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { transactions: true } }
      }
    })

    // Calcular saldo atual baseado nas transações
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const income = await db.transaction.aggregate({
          where: { accountId: account.id, type: "INCOME" },
          _sum: { amount: true }
        })
        const expense = await db.transaction.aggregate({
          where: { accountId: account.id, type: "EXPENSE" },
          _sum: { amount: true }
        })
        
        const currentBalance = account.initialBalance + 
          (income._sum.amount || 0) - 
          (expense._sum.amount || 0)

        return {
          ...account,
          currentBalance,
          transactionCount: account._count.transactions
        }
      })
    )

    return NextResponse.json({ accounts: accountsWithBalance })
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json({ error: "Erro ao carregar contas" }, { status: 500 })
  }
}

// POST - Criar nova conta
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
    const result = createAccountSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const { name, type, balance, initialBalance, currency, color, icon, bankName, bankCode, agency, accountNumber } = result.data

    // Verificar se é a primeira conta (será default)
    const count = await db.financialAccount.count({ where: { userId: decoded.id } })
    const isDefault = count === 0

    const account = await db.financialAccount.create({
      data: {
        userId: decoded.id,
        name,
        type,
        balance: balance || initialBalance || 0,
        initialBalance: initialBalance || balance || 0,
        currency: currency || "BRL",
        color: color || null,
        icon: icon || null,
        bankName: bankName || null,
        bankCode: bankCode || null,
        agency: agency || null,
        accountNumber: accountNumber || null,
        isDefault,
        isActive: true,
      }
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}

// PATCH - Atualizar conta
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

    // Verificar se a conta pertence ao usuário
    const account = await db.financialAccount.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    const updated = await db.financialAccount.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ account: updated })
  } catch (error) {
    console.error("Update account error:", error)
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 })
  }
}

// DELETE - Remover conta (soft delete)
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

    // Verificar se a conta pertence ao usuário
    const account = await db.financialAccount.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    // Soft delete
    await db.financialAccount.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 })
  }
}
