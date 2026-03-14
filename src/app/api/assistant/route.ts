import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { RecurringFrequency, TransactionType } from "@prisma/client"
import { getJwtSecret } from "@/lib/jwt-secret"

// ==================== UTILITIES ====================

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:r\$|reais?|valor)\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)/i,
    /(\d+(?:[.,]\d{1,2})?)/
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return parseFloat(match[1].replace(",", "."))
  }
  return null
}

function extractDay(text: string): number | null {
  const match = text.match(/dia\s*(\d{1,2})/i)
  return match ? parseInt(match[1]) : null
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// ==================== DETECTION FUNCTIONS ====================

function detectIntent(text: string): string {
  const normalized = normalizeText(text)
  
  // Consultas e análises
  if (normalized.includes("quanto gastei") || normalized.includes("quanto gasto") || normalized.includes("total de gastos") || normalized.includes("total de despesas")) return "query_expenses"
  if (normalized.includes("quanto recebi") || normalized.includes("total de receitas") || normalized.includes("minhas receitas")) return "query_income"
  if (normalized.includes("saldo") || normalized.includes("quanto tenho") || normalized.includes("meu dinheiro")) return "query_balance"
  if (normalized.includes("resumo") || normalized.includes("panorama") || normalized.includes("visao geral") || normalized.includes("visão geral")) return "financial_summary"
  if (normalized.includes("maiores gastos") || normalized.includes("top gastos") || normalized.includes("gastei mais") || normalized.includes("onde gastei mais")) return "top_expenses"
  if (normalized.includes("categoria") || normalized.includes("gastando mais") || normalized.includes("onde estou gastando")) return "category_analysis"
  if (normalized.includes("contas vencem") || normalized.includes("vencem esta semana") || normalized.includes("contas a vencer") || normalized.includes("boletos a pagar")) return "upcoming_bills"
  if (normalized.includes("metas") || normalized.includes("objetivos") || normalized.includes("como esta minha meta") || normalized.includes("progresso da meta")) return "goals_status"
  if (normalized.includes("assinatura") || normalized.includes("recorrentes") || normalized.includes("gastos fixos") || normalized.includes("mensalidades")) return "list_recurring"
  if (normalized.includes("comparar") || normalized.includes("comparacao") || normalized.includes("mês passado") || normalized.includes("mes anterior")) return "compare_periods"
  if (normalized.includes("transfer") || normalized.includes("mover") || normalized.includes("passar")) return "transfer"
  if (normalized.includes("adicionar") && normalized.includes("meta")) return "add_to_goal"
  if (normalized.includes("buscar") || normalized.includes("procurar") || normalized.includes("encontrar") || normalized.includes("quais foram os gastos de")) return "search_transactions"
  if (normalized.includes("dica") || normalized.includes("economizar") || normalized.includes("poupar")) return "financial_tips"
  if (normalized.includes("alerta") || normalized.includes("avisar") || normalized.includes("notificar")) return "create_alert"
  if (normalized.includes("lembrete") && (normalized.includes("recorrente") || normalized.includes("mensal"))) return "create_recurring_reminder"
  if (normalized.includes("lembrete") || normalized.includes("avisa") || normalized.includes("conta a pagar") || normalized.includes("boleto")) return "create_reminder"
  if (normalized.includes("recorrente") || normalized.includes("mensal") || normalized.includes("todo mes") || normalized.includes("assinatura")) return "create_recurring"
  if (normalized.includes("meta") || normalized.includes("objetivo") || normalized.includes("juntar") || normalized.includes("economizar para")) return "create_goal"
  if (normalized.includes("recebi") || normalized.includes("ganhei") || normalized.includes("depositaram") || normalized.includes("salario") || normalized.includes("renda")) return "create_income"
  if (normalized.includes("gastei") || normalized.includes("paguei") || normalized.includes("comprei") || normalized.includes("despesa")) return "create_expense"
  if (normalized.includes("oi") || normalized.includes("ola") || normalized.includes("bom dia") || normalized.includes("boa tarde")) return "greeting"
  if (normalized.includes("ajuda") || normalized.includes("help") || normalized.includes("como funciona") || normalized.includes("o que voce faz")) return "help"
  
  return "general_chat"
}

// ==================== ACTION HANDLERS ====================

async function handleFinancialSummary(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

  // Dados do mês atual
  const currentMonthTransactions = await db.transaction.findMany({
    where: { 
      userId,
      date: { gte: startOfMonth }
    },
    include: { category: true }
  })

  // Dados do mês passado
  const lastMonthTransactions = await db.transaction.findMany({
    where: { 
      userId,
      date: { gte: startOfLastMonth, lte: endOfLastMonth }
    }
  })

  // Contas
  const accounts = await db.financialAccount.findMany({
    where: { userId, isActive: true }
  })

  // Metas
  const goals = await db.goal.findMany({
    where: { userId, status: "IN_PROGRESS" }
  })

  // Lembretes pendentes
  const pendingReminders = await db.billReminder.findMany({
    where: { 
      userId, 
      isPaid: false,
      dueDate: { gte: today }
    },
    orderBy: { dueDate: "asc" },
    take: 5
  })

  // Cálculos
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const savings = currentIncome - currentExpenses

  // Gastos por categoria
  const categoryTotals: Record<string, number> = {}
  currentMonthTransactions
    .filter(t => t.type === "EXPENSE")
    .forEach(t => {
      const catName = t.category?.name || "Outros"
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount)
    })

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    success: true,
    response: `📊 **Resumo Financeiro - ${today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}**

💰 **Saldo Total:** R$ ${totalBalance.toFixed(2)}

📈 **Este Mês:**
• Receitas: R$ ${currentIncome.toFixed(2)}
• Despesas: R$ ${currentExpenses.toFixed(2)}
• Economia: R$ ${savings.toFixed(2)} ${savings > 0 ? "✅" : "⚠️"}

📊 **Comparação com Mês Passado:**
• Receitas: ${currentIncome >= lastMonthIncome ? "📈" : "📉"} ${Math.abs(((currentIncome - lastMonthIncome) / (lastMonthIncome || 1)) * 100).toFixed(1)}%
• Despesas: ${currentExpenses <= lastMonthExpenses ? "📉" : "📈"} ${Math.abs(((currentExpenses - lastMonthExpenses) / (lastMonthExpenses || 1)) * 100).toFixed(1)}%

🎯 **Metas Ativas:** ${goals.length} metas em progresso

📅 **Próximas Contas:** ${pendingReminders.length > 0 ? pendingReminders.map(r => `\n• ${r.name}: R$ ${Number(r.amount).toFixed(2)} (${r.dueDate.toLocaleDateString("pt-BR")})`).join("") : "\n✅ Nenhuma conta pendente"}

💡 **Top 5 Categorias:**
${topCategories.map(([cat, val], i) => `${i + 1}. ${cat}: R$ ${val.toFixed(2)}`).join("\n")}`
  }
}

async function handleTopExpenses(userId: string, text: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const transactions = await db.transaction.findMany({
    where: { 
      userId, 
      type: "EXPENSE",
      date: { gte: startOfMonth }
    },
    orderBy: { amount: "desc" },
    take: 10,
    include: { category: true }
  })

  if (transactions.length === 0) {
    return { success: true, response: "Você ainda não teve despesas este mês! 🎉" }
  }

  const top5 = transactions.slice(0, 5)
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    success: true,
    response: `📊 **Maiores Gastos do Mês**

${top5.map((t, i) => `${i + 1}. **${t.description}** - R$ ${Number(t.amount).toFixed(2)}
   📁 ${t.category?.name || "Sem categoria"} | 📅 ${t.date.toLocaleDateString("pt-BR")}`).join("\n\n")}

💰 **Total de despesas do mês:** R$ ${total.toFixed(2)}
📊 **Média por transação:** R$ ${(total / transactions.length).toFixed(2)}`
  }
}

async function handleCategoryAnalysis(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const transactions = await db.transaction.findMany({
    where: { 
      userId, 
      type: "EXPENSE",
      date: { gte: startOfMonth }
    },
    include: { category: true }
  })

  const categoryTotals: Record<string, number> = {}
  transactions.forEach(t => {
    const catName = t.category?.name || "Outros"
    categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount)
  })

  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((sum, [, val]) => sum + val, 0)

  return {
    success: true,
    response: `📊 **Análise por Categoria - ${today.toLocaleDateString("pt-BR", { month: "long" })}**

${sorted.map(([cat, val], i) => {
  const pct = ((val / total) * 100).toFixed(1)
  const bar = "█".repeat(Math.round(Number(pct) / 5))
  return `${i + 1}. **${cat}**
   ${bar} R$ ${val.toFixed(2)} (${pct}%)`
}).join("\n\n")}

💰 **Total:** R$ ${total.toFixed(2)}

💡 **Dica:** ${sorted[0] ? `Você está gastando mais com "${sorted[0][0]}". Considere revisar esses gastos para economizar.` : ""}`
  }
}

async function handleUpcomingBills(userId: string) {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const reminders = await db.billReminder.findMany({
    where: { 
      userId, 
      isPaid: false,
      dueDate: { 
        gte: today,
        lte: nextWeek
      }
    },
    orderBy: { dueDate: "asc" }
  })

  const allReminders = await db.billReminder.findMany({
    where: { userId, isPaid: false },
    orderBy: { dueDate: "asc" },
    take: 10
  })

  const weekTotal = reminders.reduce((sum, r) => sum + Number(r.amount), 0)

  return {
    success: true,
    response: reminders.length > 0 
      ? `📅 **Contas que Vencem Esta Semana**

${reminders.map(r => {
  const daysUntil = Math.ceil((new Date(r.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const urgency = daysUntil <= 2 ? "🔴" : daysUntil <= 5 ? "🟡" : "🟢"
  return `${urgency} **${r.name}**
   💰 R$ ${Number(r.amount).toFixed(2)}
   📅 ${new Date(r.dueDate).toLocaleDateString("pt-BR")} (${daysUntil} dias)`
}).join("\n\n")}

💰 **Total a pagar:** R$ ${weekTotal.toFixed(2)}`
      : `✅ **Nenhuma conta vence esta semana!**

${allReminders.length > 0 ? `📋 **Próximas contas pendentes:**
${allReminders.slice(0, 3).map(r => `• ${r.name}: R$ ${Number(r.amount).toFixed(2)} (${new Date(r.dueDate).toLocaleDateString("pt-BR")})`).join("\n")}` : "🎉 Você não tem contas pendentes!"}`
  }
}

async function handleGoalsStatus(userId: string) {
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })

  if (goals.length === 0) {
    return { success: true, response: "Você ainda não tem metas financeiras.\n\n💡 Diga: \"Criar meta de [valor] reais para [objetivo]\" para começar!" }
  }

  const activeGoals = goals.filter(g => g.status === "IN_PROGRESS")
  const completedGoals = goals.filter(g => g.status === "COMPLETED")

  return {
    success: true,
    response: `🎯 **Suas Metas Financeiras**

**Metas em Progresso (${activeGoals.length}):**
${activeGoals.map(g => {
  const progress = (Number(g.currentAmount) / Number(g.targetAmount)) * 100
  const remaining = Number(g.targetAmount) - Number(g.currentAmount)
  const bar = "█".repeat(Math.round(progress / 10)) + "░".repeat(10 - Math.round(progress / 10))
  return `
📌 **${g.name}**
   ${bar} ${progress.toFixed(1)}%
   💰 R$ ${Number(g.currentAmount).toFixed(2)} / R$ ${Number(g.targetAmount).toFixed(2)}
   🎯 Faltam: R$ ${remaining.toFixed(2)}
   ${g.targetDate ? `📅 Meta: ${new Date(g.targetDate).toLocaleDateString("pt-BR")}` : ""}`
}).join("\n")}

${completedGoals.length > 0 ? `\n**Metas Concluídas (${completedGoals.length}):**
${completedGoals.map(g => `✅ ${g.name} - R$ ${Number(g.targetAmount).toFixed(2)}`).join("\n")}` : ""}`
  }
}

async function handleAddToGoal(userId: string, text: string) {
  const amount = extractAmount(text)
  if (!amount) {
    return { success: false, response: "Preciso saber o valor. Exemplo: \"Adicionar 200 reais na meta de viagem\"" }
  }

  // Detectar nome da meta
  let goalName = ""
  const nameKeywords = ["viagem", "carro", "casa", "emergencia", "celular", "computador", "casamento", "estudos"]
  for (const keyword of nameKeywords) {
    if (text.includes(keyword)) {
      goalName = keyword
      break
    }
  }

  let goal
  if (goalName) {
    goal = await db.goal.findFirst({
      where: { userId, name: { contains: goalName, mode: "insensitive" }, status: "IN_PROGRESS" }
    })
  } else {
    goal = await db.goal.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { updatedAt: "desc" }
    })
  }

  if (!goal) {
    return { success: false, response: "Não encontrei essa meta. Verifique o nome ou crie uma nova meta." }
  }

  const newAmount = Number(goal.currentAmount) + amount
  const isComplete = newAmount >= Number(goal.targetAmount)

  const updated = await db.goal.update({
    where: { id: goal.id },
    data: { 
      currentAmount: newAmount,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS"
    }
  })

  return {
    success: true,
    response: isComplete
      ? `🎉 **Parabéns! Meta "${goal.name}" CONCLUÍDA!**

💰 Valor final: R$ ${newAmount.toFixed(2)}
🎯 Meta: R$ ${Number(goal.targetAmount).toFixed(2)}

Você alcançou sua meta! Que tal criar uma nova?`
      : `✅ **Valor adicionado à meta "${goal.name}"!**

💰 Depositado: R$ ${amount.toFixed(2)}
📊 Progresso: R$ ${newAmount.toFixed(2)} / R$ ${Number(goal.targetAmount).toFixed(2)}
🎯 Faltam: R$ ${(Number(goal.targetAmount) - newAmount).toFixed(2)}`
  }
}

async function handleListRecurring(userId: string) {
  const recurring = await db.recurringTransaction.findMany({
    where: { userId, isActive: true },
    orderBy: { nextDueDate: "asc" }
  })

  if (recurring.length === 0) {
    return { success: true, response: "Você não tem gastos recorrentes cadastrados.\n\n💡 Diga: \"Criar gasto recorrente de Netflix 55 reais dia 10\"" }
  }

  const total = recurring.reduce((sum, r) => sum + Number(r.amount), 0)

  return {
    success: true,
    response: `🔄 **Seus Gastos Recorrentes**

${recurring.map(r => `• **${r.description}**
   💰 R$ ${Number(r.amount).toFixed(2)} | 📅 Dia ${r.dayOfMonth} | ${r.frequency === "MONTHLY" ? "Mensal" : r.frequency}`).join("\n")}

💰 **Total mensal:** R$ ${total.toFixed(2)}
📊 **Anualmente:** R$ ${(total * 12).toFixed(2)}`
  }
}

async function handleComparePeriods(userId: string) {
  const today = new Date()
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

  const current = await db.transaction.findMany({
    where: { userId, date: { gte: startOfCurrentMonth } }
  })

  const last = await db.transaction.findMany({
    where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } }
  })

  const currentIncome = current.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const currentExpenses = current.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)
  const lastIncome = last.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const lastExpenses = last.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)

  const incomeChange = lastIncome ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
  const expenseChange = lastExpenses ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0

  return {
    success: true,
    response: `📊 **Comparação: Este Mês vs Mês Passado**

**📈 Receitas:**
• Mês atual: R$ ${currentIncome.toFixed(2)}
• Mês passado: R$ ${lastIncome.toFixed(2)}
• Variação: ${incomeChange >= 0 ? "📈" : "📉"} ${Math.abs(incomeChange).toFixed(1)}%

**📉 Despesas:**
• Mês atual: R$ ${currentExpenses.toFixed(2)}
• Mês passado: R$ ${lastExpenses.toFixed(2)}
• Variação: ${expenseChange <= 0 ? "📉" : "📈"} ${Math.abs(expenseChange).toFixed(1)}%

**💰 Economia:**
• Mês atual: R$ ${(currentIncome - currentExpenses).toFixed(2)}
• Mês passado: R$ ${(lastIncome - lastExpenses).toFixed(2)}

${currentExpenses > lastExpenses ? "⚠️ Você gastou mais que o mês passado!" : "✅ Você reduziu seus gastos!"}`
  }
}

async function handleTransfer(userId: string, text: string) {
  const amount = extractAmount(text)
  if (!amount) {
    return { success: false, response: "Preciso saber o valor. Exemplo: \"Transferir 200 reais para poupança\"" }
  }

  // Detectar contas
  const accounts = await db.financialAccount.findMany({
    where: { userId, isActive: true }
  })

  if (accounts.length < 2) {
    return { success: false, response: "Você precisa de pelo menos 2 contas para fazer transferências." }
  }

  // Detectar conta de origem e destino
  let fromAccount = accounts.find(a => a.isDefault) || accounts[0]
  let toAccount: typeof accounts[0] | undefined

  const accountKeywords = ["poupanca", "poupança", "nubank", "itau", "itau", "bradesco", "santander", "bb", "banco do brasil", "carteira", "caixa"]
  for (const keyword of accountKeywords) {
    toAccount = accounts.find(a => normalizeText(a.name).includes(keyword))
    if (toAccount && toAccount.id !== fromAccount.id) break
  }

  if (!toAccount) {
    toAccount = accounts.find(a => a.id !== fromAccount.id)
  }

  if (!toAccount) {
    return { success: false, response: "Não encontrei a conta de destino. Verifique o nome da conta." }
  }

  // Executar transferência
  await db.financialAccount.update({
    where: { id: fromAccount.id },
    data: { balance: { decrement: amount } }
  })

  await db.financialAccount.update({
    where: { id: toAccount.id },
    data: { balance: { increment: amount } }
  })

  // Criar transação
  await db.transaction.create({
    data: {
      userId,
      type: "TRANSFER",
      amount,
      description: `Transferência: ${fromAccount.name} → ${toAccount.name}`,
      date: new Date(),
      accountId: fromAccount.id,
      isPaid: true
    }
  })

  return {
    success: true,
    response: `✅ **Transferência realizada!**

📤 **De:** ${fromAccount.name}
📥 **Para:** ${toAccount.name}
💰 **Valor:** R$ ${amount.toFixed(2)}`
  }
}

async function handleSearchTransactions(userId: string, text: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Extrair termo de busca
  let searchTerm = ""
  const searchPatterns = [
    /gastos de (\w+)/i,
    /busc[ar]* (.+)/i,
    /procur[ar]* (.+)/i,
    /encontr[ar]* (.+)/i,
    /transacoes de (\w+)/i
  ]
  
  for (const pattern of searchPatterns) {
    const match = text.match(pattern)
    if (match) {
      searchTerm = match[1]
      break
    }
  }

  if (!searchTerm) {
    return { success: false, response: "O que você quer buscar? Exemplo: \"Buscar gastos de Uber\"" }
  }

  const transactions = await db.transaction.findMany({
    where: { 
      userId,
      description: { contains: searchTerm, mode: "insensitive" }
    },
    orderBy: { date: "desc" },
    take: 10,
    include: { category: true }
  })

  if (transactions.length === 0) {
    return { success: true, response: `Não encontrei transações com "${searchTerm}".` }
  }

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0)

  return {
    success: true,
    response: `🔍 **Resultados para "${searchTerm}"**

${transactions.slice(0, 5).map(t => `• ${t.description} - R$ ${Number(t.amount).toFixed(2)} (${t.date.toLocaleDateString("pt-BR")})`).join("\n")}

📊 ${transactions.length} transações encontradas
💰 Total: R$ ${total.toFixed(2)}`
  }
}

async function handleQueryExpenses(userId: string, text: string) {
  const today = new Date()
  const normalized = normalizeText(text)

  let startDate: Date
  let periodLabel: string

  if (normalized.includes("semana") || normalized.includes("ultimos 7 dias")) {
    startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 7)
    periodLabel = "últimos 7 dias"
  } else if (normalized.includes("ano") || normalized.includes("ultimos 12 meses")) {
    startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() - 1)
    periodLabel = "último ano"
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    periodLabel = "este mês"
  }

  const transactions = await db.transaction.findMany({
    where: { 
      userId, 
      type: "EXPENSE",
      date: { gte: startDate }
    },
    include: { category: true }
  })

  // Por categoria
  const byCategory: Record<string, number> = {}
  transactions.forEach(t => {
    const cat = t.category?.name || "Outros"
    byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount)
  })

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0)

  return {
    success: true,
    response: `📊 **Gastos ${periodLabel}**

💰 **Total:** R$ ${total.toFixed(2)}
📝 **Transações:** ${transactions.length}

**Por Categoria:**
${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => `• ${cat}: R$ ${val.toFixed(2)} (${((val / total) * 100).toFixed(1)}%)`).join("\n")}`
  }
}

async function handleQueryIncome(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const transactions = await db.transaction.findMany({
    where: { 
      userId, 
      type: "INCOME",
      date: { gte: startOfMonth }
    },
    include: { category: true }
  })

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0)

  return {
    success: true,
    response: `📈 **Receitas Este Mês**

💰 **Total:** R$ ${total.toFixed(2)}
📝 **Transações:** ${transactions.length}

${transactions.slice(0, 5).map(t => `• ${t.description}: R$ ${Number(t.amount).toFixed(2)} (${t.date.toLocaleDateString("pt-BR")})`).join("\n")}`
  }
}

async function handleQueryBalance(userId: string) {
  const accounts = await db.financialAccount.findMany({
    where: { userId, isActive: true }
  })

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

  return {
    success: true,
    response: `💰 **Seu Saldo Atual**

${accounts.map(a => `• **${a.name}:** R$ ${Number(a.balance).toFixed(2)}`).join("\n")}

📊 **Total:** R$ ${totalBalance.toFixed(2)}`
  }
}

async function handleFinancialTips(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: startOfMonth } }
  })

  const accounts = await db.financialAccount.findMany({ where: { userId } })
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const expenses = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

  const tips: string[] = []

  if (savingsRate < 10) {
    tips.push("⚠️ **Taxa de economia baixa!** Tente economizar pelo menos 20% da sua renda.")
  } else if (savingsRate >= 20) {
    tips.push("✅ **Ótimo!** Você está economizando mais de 20% da sua renda.")
  }

  if (totalBalance < income * 3) {
    tips.push("💡 Crie uma reserva de emergência de 3 a 6 meses de despesas.")
  }

  const recurring = await db.recurringTransaction.findMany({
    where: { userId, isActive: true, type: "EXPENSE" }
  })
  const recurringTotal = recurring.reduce((s, r) => s + Number(r.amount), 0)
  
  if (recurringTotal > income * 0.5) {
    tips.push(`⚠️ Seus gastos fixos (R$ ${recurringTotal.toFixed(2)}) representam mais de 50% da renda. Considere reduzir assinaturas.`)
  }

  tips.push("📱 Anote todos os gastos, até os pequenos - eles somam!")
  tips.push("🎯 Defina metas financeiras claras e acompanhe o progresso.")
  tips.push("💳 Revise suas assinaturas mensais e cancele o que não usa.")

  return {
    success: true,
    response: `💡 **Dicas Personalizadas para Você**

${tips.join("\n\n")}

📊 **Sua situação atual:**
• Taxa de economia: ${savingsRate.toFixed(1)}%
• Reserva atual: R$ ${totalBalance.toFixed(2)}`
  }
}

// ==================== CREATE ACTIONS ====================

async function createGoalAction(userId: string, text: string) {
  const amount = extractAmount(text)
  if (!amount) return { success: false, response: "Preciso do valor. Exemplo: \"Criar meta de 5000 reais para viagem\"" }

  let name = "Minha Meta"
  const names: Record<string, string[]> = {
    "Viagem": ["viagem", "viajar"],
    "Carro": ["carro", "automovel"],
    "Casa": ["casa", "apartamento", "imovel"],
    "Reserva de Emergência": ["emergencia", "reserva"],
    "Celular": ["celular", "telefone", "iphone"],
    "Computador": ["computador", "notebook", "pc"],
    "Casamento": ["casamento", "casar"]
  }

  for (const [goalName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = goalName
      break
    }
  }

  const goal = await db.goal.create({
    data: {
      userId,
      name,
      targetAmount: amount,
      status: "IN_PROGRESS",
      description: `Meta criada via Tera IA`
    }
  })

  return { success: true, response: `🎯 **Meta criada com sucesso!**

📌 **${name}**
💰 Objetivo: R$ ${amount.toFixed(2)}
📊 Progresso: R$ 0.00 (0%)

Continue economizando e use "Adicionar [valor] na meta de ${name.toLowerCase()}" para acompanhar o progresso!` }
}

async function createReminderAction(userId: string, text: string) {
  const amount = extractAmount(text)
  const day = extractDay(text) || 10

  if (!amount) return { success: false, response: "Preciso do valor. Exemplo: \"Criar lembrete para conta de luz 150 reais dia 15\"" }

  let name = "Conta"
  const names: Record<string, string[]> = {
    "Conta de Luz": ["luz", "energia"],
    "Conta de Água": ["agua"],
    "Internet": ["internet", "wifi"],
    "Aluguel": ["aluguel"],
    "Condomínio": ["condominio"],
    "Netflix": ["netflix"],
    "Spotify": ["spotify"],
    "YouTube": ["youtube"],
    "Academia": ["academia"],
    "Fatura do Cartão": ["cartao", "fatura"]
  }

  for (const [itemName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = itemName
      break
    }
  }

  const today = new Date()
  let month = today.getMonth() + 1
  let year = today.getFullYear()
  if (day < today.getDate()) {
    month = month === 12 ? 1 : month + 1
    year = month === 1 ? year + 1 : year
  }
  const dueDate = new Date(year, month - 1, day)

  const reminder = await db.billReminder.create({
    data: {
      userId,
      name,
      amount,
      dueDate,
      category: "Contas",
      remindDays: 3
    }
  })

  return { success: true, response: `🔔 **Lembrete criado!**

📌 **${name}**
💰 Valor: R$ ${amount.toFixed(2)}
📅 Vencimento: ${dueDate.toLocaleDateString("pt-BR")}

Você será notificado 3 dias antes do vencimento!` }
}

async function createRecurringAction(userId: string, text: string) {
  const amount = extractAmount(text)
  const day = extractDay(text) || 10

  if (!amount) return { success: false, response: "Preciso do valor. Exemplo: \"Criar gasto recorrente Netflix 55 reais dia 10\"" }

  let name = "Gasto Recorrente"
  const names: Record<string, string[]> = {
    "Netflix": ["netflix"],
    "Spotify": ["spotify"],
    "YouTube Premium": ["youtube"],
    "Amazon Prime": ["amazon", "prime"],
    "Academia": ["academia"],
    "Aluguel": ["aluguel"],
    "Internet": ["internet"]
  }

  for (const [itemName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = itemName
      break
    }
  }

  const nextDueDate = new Date()
  nextDueDate.setDate(day)
  if (nextDueDate <= new Date()) nextDueDate.setMonth(nextDueDate.getMonth() + 1)

  const recurring = await db.recurringTransaction.create({
    data: {
      userId,
      type: "EXPENSE",
      description: name,
      amount,
      dayOfMonth: day,
      frequency: "MONTHLY",
      startDate: new Date(),
      nextDueDate,
      isActive: true,
      autoCreate: true,
      notifyBefore: 3
    }
  })

  return { success: true, response: `🔄 **Gasto recorrente criado!**

📌 **${name}**
💰 Valor: R$ ${amount.toFixed(2)}
📅 Dia: ${day} de cada mês
📆 Próximo: ${nextDueDate.toLocaleDateString("pt-BR")}

O gasto será lançado automaticamente todo mês!` }
}

async function createRecurringReminderAction(userId: string, text: string) {
  const amount = extractAmount(text)
  const day = extractDay(text) || 10

  if (!amount) return { success: false, response: "Preciso do valor." }

  let name = "Conta"
  const names: Record<string, string[]> = {
    "Aluguel": ["aluguel"],
    "Condomínio": ["condominio"],
    "Internet": ["internet"],
    "Conta de Luz": ["luz"],
    "Conta de Água": ["agua"]
  }

  for (const [itemName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = itemName
      break
    }
  }

  const today = new Date()
  let month = today.getMonth() + 1
  let year = today.getFullYear()
  if (day < today.getDate()) {
    month = month === 12 ? 1 : month + 1
    year = month === 1 ? year + 1 : year
  }
  const dueDate = new Date(year, month - 1, day)

  // Criar recorrente
  const nextDueDate = new Date()
  nextDueDate.setDate(day)
  if (nextDueDate <= new Date()) nextDueDate.setMonth(nextDueDate.getMonth() + 1)

  await db.recurringTransaction.create({
    data: {
      userId,
      type: "EXPENSE",
      description: name,
      amount,
      dayOfMonth: day,
      frequency: "MONTHLY",
      startDate: new Date(),
      nextDueDate,
      isActive: true,
      autoCreate: true,
      notifyBefore: 3
    }
  })

  // Criar lembrete
  await db.billReminder.create({
    data: {
      userId,
      name,
      amount,
      dueDate,
      category: "Contas",
      remindDays: 3,
      isRecurring: true,
      recurringPeriod: "monthly"
    }
  })

  return { success: true, response: `🔄🔔 **Gasto recorrente + Lembrete criados!**

📌 **${name}**
💰 Valor: R$ ${amount.toFixed(2)}
📅 Dia: ${day} de cada mês

✅ Gasto recorrente configurado
✅ Lembrete criado para ${dueDate.toLocaleDateString("pt-BR")}

Você será notificado antes de cada vencimento!` }
}

async function createIncomeAction(userId: string, text: string) {
  const amount = extractAmount(text)
  if (!amount) return { success: false, response: "Preciso do valor. Exemplo: \"Recebi 500 reais de freelancer\"" }

  let name = "Receita"
  const names: Record<string, string[]> = {
    "Trabalho Freelancer": ["freelancer", "freela"],
    "Salário": ["salario"],
    "Venda": ["venda", "vendi"],
    "Comissão": ["comissao"],
    "Bônus": ["bonus"]
  }

  for (const [itemName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = itemName
      break
    }
  }

  const account = await db.financialAccount.findFirst({
    where: { userId, isDefault: true }
  })

  const category = await db.category.findFirst({
    where: { isDefault: true, type: "INCOME" }
  })

  await db.transaction.create({
    data: {
      userId,
      type: "INCOME",
      description: name,
      amount,
      date: new Date(),
      accountId: account?.id,
      categoryId: category?.id,
      isPaid: true
    }
  })

  if (account) {
    await db.financialAccount.update({
      where: { id: account.id },
      data: { balance: { increment: amount } }
    })
  }

  return { success: true, response: `💰 **Receita registrada!**

📌 **${name}**
💰 Valor: R$ ${amount.toFixed(2)}
📅 Data: ${new Date().toLocaleDateString("pt-BR")}

Seu saldo foi atualizado!` }
}

async function createExpenseAction(userId: string, text: string) {
  const amount = extractAmount(text)
  if (!amount) return { success: false, response: "Preciso do valor. Exemplo: \"Gastei 50 reais no mercado\"" }

  let name = "Despesa"
  const names: Record<string, string[]> = {
    "Mercado": ["mercado", "supermercado"],
    "Alimentação": ["almoco", "almoço", "restaurante", "comida"],
    "Combustível": ["gasolina", "combustivel", "posto"],
    "Transporte": ["uber", "99", "taxi"],
    "Farmácia": ["farmacia", "remedio"]
  }

  for (const [itemName, keywords] of Object.entries(names)) {
    if (keywords.some(k => text.includes(k))) {
      name = itemName
      break
    }
  }

  const account = await db.financialAccount.findFirst({
    where: { userId, isDefault: true }
  })

  const category = await db.category.findFirst({
    where: { isDefault: true, type: "EXPENSE" }
  })

  await db.transaction.create({
    data: {
      userId,
      type: "EXPENSE",
      description: name,
      amount,
      date: new Date(),
      accountId: account?.id,
      categoryId: category?.id,
      isPaid: true
    }
  })

  if (account) {
    await db.financialAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: amount } }
    })
  }

  return { success: true, response: `📝 **Despesa registrada!**

📌 **${name}**
💰 Valor: R$ ${amount.toFixed(2)}
📅 Data: ${new Date().toLocaleDateString("pt-BR")}` }
}

// ==================== MAIN HANDLER ====================

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
    const { message } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 })
    }

    const text = normalizeText(message)
    const intent = detectIntent(text)

    let result: { success: boolean; response: string; action?: string }

    switch (intent) {
      case "financial_summary":
        result = await handleFinancialSummary(decoded.id)
        break
      case "top_expenses":
        result = await handleTopExpenses(decoded.id, text)
        break
      case "category_analysis":
        result = await handleCategoryAnalysis(decoded.id)
        break
      case "upcoming_bills":
        result = await handleUpcomingBills(decoded.id)
        break
      case "goals_status":
        result = await handleGoalsStatus(decoded.id)
        break
      case "add_to_goal":
        result = await handleAddToGoal(decoded.id, text)
        break
      case "list_recurring":
        result = await handleListRecurring(decoded.id)
        break
      case "compare_periods":
        result = await handleComparePeriods(decoded.id)
        break
      case "transfer":
        result = await handleTransfer(decoded.id, text)
        break
      case "search_transactions":
        result = await handleSearchTransactions(decoded.id, text)
        break
      case "query_expenses":
        result = await handleQueryExpenses(decoded.id, text)
        break
      case "query_income":
        result = await handleQueryIncome(decoded.id)
        break
      case "query_balance":
        result = await handleQueryBalance(decoded.id)
        break
      case "financial_tips":
        result = await handleFinancialTips(decoded.id)
        break
      case "create_goal":
        result = await createGoalAction(decoded.id, text)
        break
      case "create_reminder":
        result = await createReminderAction(decoded.id, text)
        break
      case "create_recurring":
        result = await createRecurringAction(decoded.id, text)
        break
      case "create_recurring_reminder":
        result = await createRecurringReminderAction(decoded.id, text)
        break
      case "create_income":
        result = await createIncomeAction(decoded.id, text)
        break
      case "create_expense":
        result = await createExpenseAction(decoded.id, text)
        break
      case "greeting":
        result = { success: true, response: `Olá! 👋 Sou a **Tera**, sua assistente financeira inteligente do Monetra!

**Posso ajudá-lo com:**

🎯 **Metas** - Criar, acompanhar e adicionar valores
🔔 **Lembretes** - Configurar alertas de contas
🔄 **Recorrentes** - Gerenciar assinaturas e gastos fixos
💰 **Transações** - Adicionar receitas e despesas rapidamente
📊 **Análises** - Ver resumo, comparar períodos, categorias
🔍 **Buscas** - Encontrar transações específicas
💡 **Dicas** - Sugestões personalizadas de economia

**Como posso ajudar você hoje?**` }
        break
      case "help":
        result = { success: true, response: `🎯 **Tudo que a Tera pode fazer!**

**📊 Consultas:**
• "Qual meu saldo?"
• "Quanto gastei este mês?"
• "Quais contas vencem esta semana?"
• "Como estão minhas metas?"

**📈 Análises:**
• "Me dê um resumo financeiro"
• "O que estou gastando mais?"
• "Compare com mês passado"
• "Quais meus maiores gastos?"

**🎯 Metas:**
• "Criar meta de 5000 reais para viagem"
• "Adicionar 200 reais na meta de emergência"
• "Como está minha meta?"

**🔔 Lembretes:**
• "Criar lembrete para conta de luz dia 15"
• "Criar lembrete recorrente para aluguel 400"

**🔄 Recorrentes:**
• "Criar gasto recorrente Netflix 55 reais dia 10"
• "Quais minhas assinaturas?"

**💰 Transações:**
• "Recebi 500 reais de freelancer"
• "Gastei 50 reais no mercado"
• "Transferir 200 para poupança"

**💡 Dicas:**
• "Me dê dicas para economizar"` }
        break
      default:
        result = { success: true, response: `Não entendi muito bem. 🤔

Tente algo como:
• "Resumo financeiro"
• "Quanto gastei este mês?"
• "Criar meta de 1000 reais"
• "Quais contas vencem esta semana?"

Ou digite **"ajuda"** para ver tudo que posso fazer!` }
    }

    return NextResponse.json({
      success: result.success,
      action: intent,
      response: result.response
    })
  } catch (error) {
    console.error("Assistant API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
