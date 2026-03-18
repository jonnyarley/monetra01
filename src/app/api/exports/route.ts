import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { ExportType, ExportFormat, ExportStatus } from "@prisma/client"

// GET - Listar histórico de exportações
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const exports = await db.exportHistory.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json(exports)
  } catch (error) {
    console.error("Erro ao buscar exportações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova exportação
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
    const { type, format, dateRange } = body

    // Criar registro de exportação
    const exportRecord = await db.exportHistory.create({
      data: {
        userId: decoded.id,
        type: type as ExportType,
        format: format as ExportFormat,
        status: ExportStatus.PROCESSING,
        dateRange
      }
    })

    // Buscar dados para exportação baseado no tipo
    let recordCount = 0
    let dataToExport: unknown[] = []

    const now = new Date()
    let startDate: Date
    let endDate = new Date()

    // Calcular período
    switch (dateRange) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case "last_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(2020, 0, 1) // All data
    }

    // Buscar dados conforme tipo
    switch (type) {
      case "TRANSACTIONS":
        const transactions = await db.transaction.findMany({
          where: {
            userId: decoded.id,
            date: { gte: startDate, lte: endDate }
          },
          include: {
            category: true,
            account: true
          }
        })
        dataToExport = transactions
        recordCount = transactions.length
        break

      case "GOALS":
        const goals = await db.goal.findMany({
          where: { userId: decoded.id }
        })
        dataToExport = goals
        recordCount = goals.length
        break

      case "BUDGETS":
        const budgets = await db.budget.findMany({
          where: { userId: decoded.id },
          include: { category: true }
        })
        dataToExport = budgets
        recordCount = budgets.length
        break

      case "ALL":
        const [allTransactions, allGoals, allBudgets] = await Promise.all([
          db.transaction.findMany({
            where: {
              userId: decoded.id,
              date: { gte: startDate, lte: endDate }
            },
            include: { category: true, account: true }
          }),
          db.goal.findMany({ where: { userId: decoded.id } }),
          db.budget.findMany({
            where: { userId: decoded.id },
            include: { category: true }
          })
        ])
        dataToExport = { transactions: allTransactions, goals: allGoals, budgets: allBudgets }
        recordCount = allTransactions.length + allGoals.length + allBudgets.length
        break
    }

    // Simular processamento de arquivo
    const fileSize = JSON.stringify(dataToExport).length

    // Atualizar registro como concluído
    const updatedExport = await db.exportHistory.update({
      where: { id: exportRecord.id },
      data: {
        status: ExportStatus.COMPLETED,
        recordCount,
        fileSize,
        completedAt: new Date()
      }
    })

    // Se formato CSV ou XLSX, retornar dados para download
    if (format === "CSV" || format === "XLSX") {
      return NextResponse.json({
        ...updatedExport,
        data: dataToExport,
        downloadReady: true
      })
    }

    // Para PDF, retornar dados para geração
    return NextResponse.json({
      ...updatedExport,
      data: dataToExport,
      downloadReady: true
    })
  } catch (error) {
    console.error("Erro ao criar exportação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover histórico de exportação
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

    // Verificar se a exportação pertence ao usuário
    const existing = await db.exportHistory.findFirst({
      where: { id, userId: decoded.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Exportação não encontrada" }, { status: 404 })
    }

    await db.exportHistory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar exportação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
