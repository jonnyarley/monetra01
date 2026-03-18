import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

// ==================== FUNÇÕES DE ANÁLISE ====================

async function getFinancialData(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  // Transações do mês atual
  const currentMonthTransactions = await db.transaction.findMany({
    where: { userId, date: { gte: startOfMonth } },
    include: { category: true, account: true }
  })

  // Transações do mês passado
  const lastMonthTransactions = await db.transaction.findMany({
    where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
    include: { category: true }
  })

  // Transações do ano
  const yearTransactions = await db.transaction.findMany({
    where: { userId, date: { gte: startOfYear } },
    include: { category: true }
  })

  // Contas
  const accounts = await db.financialAccount.findMany({
    where: { userId, isActive: true }
  })

  // Metas
  const goals = await db.goal.findMany({ where: { userId } })

  // Gastos recorrentes
  const recurring = await db.recurringTransaction.findMany({
    where: { userId, isActive: true }
  })

  // Lembretes pendentes
  const pendingBills = await db.billReminder.findMany({
    where: { userId, isPaid: false },
    orderBy: { dueDate: "asc" }
  })

  // Orçamentos
  const budgets = await db.budget.findMany({
    where: { userId, month: today.getMonth() + 1, year: today.getFullYear() },
    include: { category: true }
  })

  return {
    currentMonthTransactions,
    lastMonthTransactions,
    yearTransactions,
    accounts,
    goals,
    recurring,
    pendingBills,
    budgets,
    today
  }
}

function calculateMetrics(data: Awaited<ReturnType<typeof getFinancialData>>) {
  const { currentMonthTransactions, lastMonthTransactions, yearTransactions, accounts, goals, recurring, pendingBills, budgets, today } = data

  // Mês atual
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0)

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0)

  // Mês passado
  const lastIncome = lastMonthTransactions
    .filter(t => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0)

  const lastExpenses = lastMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0)

  // Ano
  const yearIncome = yearTransactions
    .filter(t => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0)

  const yearExpenses = yearTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0)

  // Saldo
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  // Por categoria
  const categoryBreakdown: Record<string, { amount: number; count: number }> = {}
  currentMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .forEach(t => {
      const cat = t.category?.name || "Outros"
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { amount: 0, count: 0 }
      categoryBreakdown[cat].amount += Number(t.amount)
      categoryBreakdown[cat].count++
    })

  // Top categorias
  const topCategories = Object.entries(categoryBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)

  // Tendência mensal
  const monthlyTrend: { month: string; income: number; expense: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
    
    const monthTx = yearTransactions.filter(t => 
      new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
    )

    monthlyTrend.push({
      month: monthStart.toLocaleDateString("pt-BR", { month: "short" }),
      income: monthTx.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0),
      expense: monthTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)
    })
  }

  // Alertas e insights
  const alerts: { type: "warning" | "success" | "info" | "danger"; title: string; description: string }[] = []

  // Alerta de gastos elevados
  if (currentExpenses > lastExpenses * 1.1) {
    const increase = ((currentExpenses - lastExpenses) / lastExpenses * 100).toFixed(1)
    alerts.push({
      type: "warning",
      title: "Gastos Elevados",
      description: `Seus gastos aumentaram ${increase}% em relação ao mês passado. Considere revisar suas despesas.`
    })
  }

  // Alerta de economia
  const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0
  if (savingsRate >= 20) {
    alerts.push({
      type: "success",
      title: "Excelente Taxa de Economia",
      description: `Você está economizando ${savingsRate.toFixed(1)}% da sua renda. Continue assim!`
    })
  } else if (savingsRate < 10 && currentIncome > 0) {
    alerts.push({
      type: "danger",
      title: "Taxa de Economia Baixa",
      description: `Apenas ${savingsRate.toFixed(1)}% de taxa de economia. Ideal é pelo menos 20%.`
    })
  }

  // Alerta de contas a vencer
  const upcomingBills = pendingBills.filter(b => {
    const dueDate = new Date(b.dueDate)
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    return dueDate <= weekLater
  })

  if (upcomingBills.length > 0) {
    const total = upcomingBills.reduce((s, b) => s + Number(b.amount), 0)
    alerts.push({
      type: "info",
      title: "Contas a Vencer",
      description: `${upcomingBills.length} contas vencem esta semana, totalizando R$ ${total.toFixed(2)}.`
    })
  }

  // Alerta de metas
  const goalsNearComplete = goals.filter(g => {
    const progress = Number(g.currentAmount) / Number(g.targetAmount)
    return progress >= 0.8 && progress < 1
  })

  if (goalsNearComplete.length > 0) {
    alerts.push({
      type: "success",
      title: "Metas Quase Concluídas",
      description: `${goalsNearComplete.length} meta(s) com mais de 80% de progresso. Você está quase lá!`
    })
  }

  // Alerta de assinaturas
  const totalRecurring = recurring.reduce((s, r) => s + Number(r.amount), 0)
  if (totalRecurring > currentIncome * 0.3) {
    alerts.push({
      type: "warning",
      title: "Assinaturas Elevadas",
      description: `Suas assinaturas somam R$ ${totalRecurring.toFixed(2)}/mês, mais de 30% da sua renda.`
    })
  }

  // Alerta de reserva de emergência
  const monthlyExpenses = currentExpenses || lastExpenses
  const emergencyMonths = monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0
  if (emergencyMonths < 3) {
    alerts.push({
      type: "warning",
      title: "Reserva de Emergência Baixa",
      description: `Sua reserva cobre apenas ${emergencyMonths.toFixed(1)} meses de despesas. Ideal: 6-12 meses.`
    })
  }

  return {
    currentIncome,
    currentExpenses,
    lastIncome,
    lastExpenses,
    yearIncome,
    yearExpenses,
    totalBalance,
    savings: currentIncome - currentExpenses,
    savingsRate,
    categoryBreakdown: topCategories,
    monthlyTrend,
    alerts,
    transactionCount: currentMonthTransactions.length,
    goals,
    recurring,
    pendingBills,
    budgets
  }
}

// ==================== ENDPOINT ====================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    let decoded: { id: string }
    try {
      decoded = verify(token, jwtSecret) as { id: string }
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    const data = await getFinancialData(decoded.id)
    const metrics = calculateMetrics(data)

    return NextResponse.json({
      success: true,
      period,
      data: {
        summary: {
          totalBalance: metrics.totalBalance,
          monthlyIncome: metrics.currentIncome,
          monthlyExpenses: metrics.currentExpenses,
          savings: metrics.savings,
          savingsRate: metrics.savingsRate,
          transactionCount: metrics.transactionCount
        },
        comparison: {
          incomeChange: metrics.lastIncome > 0 
            ? ((metrics.currentIncome - metrics.lastIncome) / metrics.lastIncome) * 100 
            : 0,
          expenseChange: metrics.lastExpenses > 0 
            ? ((metrics.currentExpenses - metrics.lastExpenses) / metrics.lastExpenses) * 100 
            : 0
        },
        categories: metrics.categoryBreakdown,
        monthlyTrend: metrics.monthlyTrend,
        alerts: metrics.alerts,
        goals: metrics.goals.map(g => ({
          id: g.id,
          name: g.name,
          target: Number(g.targetAmount),
          current: Number(g.currentAmount),
          progress: (Number(g.currentAmount) / Number(g.targetAmount)) * 100,
          status: g.status
        })),
        recurring: {
          total: metrics.recurring.reduce((s, r) => s + Number(r.amount), 0),
          count: metrics.recurring.length,
          items: metrics.recurring.map(r => ({
            id: r.id,
            name: r.description,
            amount: Number(r.amount),
            day: r.dayOfMonth
          }))
        },
        pendingBills: metrics.pendingBills.map(b => ({
          id: b.id,
          name: b.name,
          amount: Number(b.amount),
          dueDate: b.dueDate,
          daysUntil: Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }))
      }
    })
  } catch (error) {
    console.error("Reports AI API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    let decoded: { id: string }
    try {
      decoded = verify(token, jwtSecret) as { id: string }
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json()
    const { question } = body

    const data = await getFinancialData(decoded.id)
    const metrics = calculateMetrics(data)

    // Gerar resposta baseada na pergunta
    let response = ""

    if (!question) {
      response = `📊 **Relatório Financeiro - ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}**

**💰 Resumo Geral:**
• Saldo Total: R$ ${metrics.totalBalance.toFixed(2)}
• Receitas do Mês: R$ ${metrics.currentIncome.toFixed(2)}
• Despesas do Mês: R$ ${metrics.currentExpenses.toFixed(2)}
• Economia: R$ ${metrics.savings.toFixed(2)} (${metrics.savingsRate.toFixed(1)}%)

**📈 Comparação com Mês Passado:**
• Receitas: ${metrics.currentIncome >= metrics.lastIncome ? "↑" : "↓"} ${Math.abs(((metrics.currentIncome - metrics.lastIncome) / (metrics.lastIncome || 1)) * 100).toFixed(1)}%
• Despesas: ${metrics.currentExpenses <= metrics.lastExpenses ? "↓" : "↑"} ${Math.abs(((metrics.currentExpenses - metrics.lastExpenses) / (metrics.lastExpenses || 1)) * 100).toFixed(1)}%

**🎯 Metas:**
• Total: ${metrics.goals.length} metas
• Em progresso: ${metrics.goals.filter(g => g.status === "IN_PROGRESS").length}
• Concluídas: ${metrics.goals.filter(g => g.status === "COMPLETED").length}

**🔔 Alertas:**
${metrics.alerts.map(a => `${a.type === "success" ? "✅" : a.type === "warning" ? "⚠️" : a.type === "danger" ? "🚨" : "ℹ️"} ${a.title}: ${a.description}`).join("\n")}`
    } else {
      // Resposta personalizada baseada na pergunta
      const q = question.toLowerCase()
      
      if (q.includes("gastei") || q.includes("despesa")) {
        response = `📊 **Análise de Despesas**

**Este mês:** R$ ${metrics.currentExpenses.toFixed(2)}
**Mês passado:** R$ ${metrics.lastExpenses.toFixed(2)}

**Top 5 Categorias:**
${metrics.categoryBreakdown.slice(0, 5).map((c, i) => `${i + 1}. ${c.name}: R$ ${c.amount.toFixed(2)} (${c.count} transações)`).join("\n")}

${metrics.currentExpenses > metrics.lastExpenses ? "⚠️ Você gastou mais que o mês passado." : "✅ Você reduziu seus gastos!"}`
      } else if (q.includes("receita") || q.includes("ganhei")) {
        response = `📈 **Análise de Receitas**

**Este mês:** R$ ${metrics.currentIncome.toFixed(2)}
**Mês passado:** R$ ${metrics.lastIncome.toFixed(2)}
**Variação:** ${((metrics.currentIncome - metrics.lastIncome) / (metrics.lastIncome || 1) * 100).toFixed(1)}%

**Este ano:** R$ ${metrics.yearIncome.toFixed(2)}`
      } else if (q.includes("meta") || q.includes("objetivo")) {
        response = `🎯 **Status das Metas**

${metrics.goals.length === 0 ? "Você ainda não tem metas cadastradas." : metrics.goals.map(g => {
  const progress = (Number(g.currentAmount) / Number(g.targetAmount)) * 100
  return `• **${g.name}**: ${progress.toFixed(1)}% (R$ ${Number(g.currentAmount).toFixed(2)} / R$ ${Number(g.targetAmount).toFixed(2)})`
}).join("\n")}`
      } else if (q.includes("economia") || q.includes("poupar")) {
        response = `💡 **Análise de Economia**

**Taxa de economia:** ${metrics.savingsRate.toFixed(1)}%
**Valor economizado:** R$ ${metrics.savings.toFixed(2)}

${metrics.savingsRate >= 20 ? "✅ Excelente! Você está economizando mais de 20%." : metrics.savingsRate >= 10 ? "⚠️ Bom, mas tente alcançar 20% de taxa de economia." : "🚨 Atenção! Sua taxa de economia está abaixo de 10%."}

**Dica:** ${metrics.alerts.find(a => a.type === "warning")?.description || "Continue acompanhando suas finanças!"}`
      } else {
        response = `Posso ajudá-lo com análises de:

• **Despesas** - "Quais meus maiores gastos?"
• **Receitas** - "Quanto recebi este mês?"
• **Metas** - "Como estão minhas metas?"
• **Economia** - "Qual minha taxa de economia?"

Faça uma pergunta específica!`
      }
    }

    return NextResponse.json({
      success: true,
      response,
      metrics: {
        totalBalance: metrics.totalBalance,
        monthlyIncome: metrics.currentIncome,
        monthlyExpenses: metrics.currentExpenses,
        savingsRate: metrics.savingsRate,
        alertsCount: metrics.alerts.length
      }
    })
  } catch (error) {
    console.error("Reports AI POST error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
