import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { RecurringFrequency, TransactionType } from "@prisma/client"
import { getJwtSecret } from "@/lib/jwt-secret"

// Tipos
type Action = {
  type: "create_goal" | "create_reminder" | "create_recurring" | "create_transaction" | "query_balance" | "query_transactions" | "general_chat"
  data: Record<string, any>
}

// Extrair número (valor) da mensagem
function extractAmount(text: string): number | null {
  const patterns = [
    /(?:r\$|reais?|valor)\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)/i,
    /(\d+(?:[.,]\d{1,2})?)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return parseFloat(match[1].replace(",", "."))
    }
  }
  return null
}

// Extrair dia da mensagem
function extractDay(text: string): number | null {
  const match = text.match(/dia\s*(\d{1,2})/i)
  return match ? parseInt(match[1]) : null
}

// Extrair nome/tema da mensagem
function extractName(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1)
    }
  }
  return null
}

// Detectar se é recorrente
function isRecurring(text: string): boolean {
  const keywords = ["recorrente", "mensal", "todo mes", "todo mês", "mensalmente", "fixo", "assinatura", "todos os meses"]
  return keywords.some(k => text.includes(k))
}

// Detectar se é lembrete
function isReminder(text: string): boolean {
  const keywords = ["lembrete", "lembra", "avisa", "notifica", "conta a pagar", "boleto", "fatura", "pagar"]
  return keywords.some(k => text.includes(k))
}

// Detectar se é meta
function isGoal(text: string): boolean {
  const keywords = ["meta", "objetivo", "juntar", "economizar para", "guardar para", "reservar"]
  return keywords.some(k => text.includes(k))
}

// Detectar se é receita
function isIncome(text: string): boolean {
  const keywords = ["recebi", "ganhei", "depositaram", "transferiram", "renda", "receita", "salario", "salário", "pagaram", "entrada de"]
  return keywords.some(k => text.includes(k))
}

// Detectar se é despesa
function isExpense(text: string): boolean {
  const keywords = ["gastei", "paguei", "comprei", "despesa", "gasto com", "custou"]
  return keywords.some(k => text.includes(k))
}

// Detectar consulta de saldo
function isBalanceQuery(text: string): boolean {
  const keywords = ["saldo", "quanto tenho", "balanco", "balanço", "meu dinheiro", "quanto dinheiro"]
  return keywords.some(k => text.includes(k))
}

// Processar mensagem e extrair ações
function processMessage(message: string): { actions: Action[], response: string } {
  const text = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const originalText = message.toLowerCase()
  
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  
  const actions: Action[] = []
  
  // === CONSULTA DE SALDO ===
  if (isBalanceQuery(text)) {
    actions.push({ type: "query_balance", data: {} })
    return {
      actions,
      response: "Vou verificar seu saldo atual! 💰"
    }
  }
  
  // === META ===
  if (isGoal(text)) {
    const amount = extractAmount(originalText)
    
    // Detectar nome da meta
    let name = "Minha Meta"
    const nameKeywords = [
      { keys: ["viagem", "viajar"], name: "Viagem" },
      { keys: ["carro", "automovel"], name: "Carro" },
      { keys: ["casa", "apartamento", "imovel"], name: "Casa" },
      { keys: ["emergencia", "reserva"], name: "Reserva de Emergência" },
      { keys: ["celular", "telefone", "iphone"], name: "Celular" },
      { keys: ["computador", "notebook", "pc"], name: "Computador" },
      { keys: ["casamento", "casar"], name: "Casamento" },
      { keys: ["estudos", "faculdade", "curso"], name: "Estudos" }
    ]
    
    for (const item of nameKeywords) {
      if (item.keys.some(k => text.includes(k))) {
        name = item.name
        break
      }
    }
    
    // Detectar data alvo
    let targetDate: string | null = null
    if (text.includes("dezembro") || text.includes("natal") || text.includes("fim do ano")) {
      targetDate = `${currentYear}-12-31`
    } else if (text.includes("junho")) {
      targetDate = `${currentYear}-06-30`
    } else if (text.includes("mes que vem") || text.includes("próximo mes")) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const year = currentMonth === 12 ? currentYear + 1 : currentYear
      targetDate = `${year}-${String(nextMonth).padStart(2, '0')}-28`
    }
    
    if (amount) {
      actions.push({
        type: "create_goal",
        data: {
          goalName: name,
          goalTargetAmount: amount,
          goalTargetDate: targetDate,
          goalDescription: `Meta criada via assistente`
        }
      })
      
      return {
        actions,
        response: `🎯 Perfeito! Vou criar a meta "${name}" com valor alvo de R$ ${amount.toFixed(2)}${targetDate ? ` para ${targetDate}` : ""}. Você pode acompanhar o progresso na página de Metas!`
      }
    }
  }
  
  // === LEMBRETE E/OU RECORRENTE ===
  if (isReminder(text) || isRecurring(text)) {
    const amount = extractAmount(originalText)
    const day = extractDay(text) || 10
    
    // Detectar nome
    let name = "Conta"
    const nameKeywords = [
      { keys: ["luz", "energia"], name: "Conta de Luz" },
      { keys: ["agua", "água"], name: "Conta de Água" },
      { keys: ["internet", "wifi"], name: "Internet" },
      { keys: ["telefone", "celular"], name: "Conta de Telefone" },
      { keys: ["aluguel"], name: "Aluguel" },
      { keys: ["condominio", "condomínio"], name: "Condomínio" },
      { keys: ["netflix"], name: "Netflix" },
      { keys: ["spotify"], name: "Spotify" },
      { keys: ["youtube"], name: "YouTube" },
      { keys: ["amazon", "prime"], name: "Amazon Prime" },
      { keys: ["academia"], name: "Academia" },
      { keys: ["cartao", "cartão"], name: "Fatura do Cartão" },
      { keys: ["iptu"], name: "IPTU" },
      { keys: ["gas", "gás"], name: "Gás" }
    ]
    
    for (const item of nameKeywords) {
      if (item.keys.some(k => text.includes(k))) {
        name = item.name
        break
      }
    }
    
    // Calcular data
    let dueDate: string
    let month = currentMonth
    let year = currentYear
    
    if (day < today.getDate()) {
      month = month === 12 ? 1 : month + 1
      year = month === 1 ? year + 1 : year
    }
    dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    if (amount) {
      // Se é recorrente E lembrete, criar AMBOS
      if (isRecurring(text) && isReminder(text)) {
        // Criar gasto recorrente
        actions.push({
          type: "create_recurring",
          data: {
            recurringType: "EXPENSE",
            recurringDescription: name,
            recurringAmount: amount,
            recurringDay: day,
            recurringFrequency: "MONTHLY"
          }
        })
        
        // Criar lembrete também
        actions.push({
          type: "create_reminder",
          data: {
            reminderName: name,
            reminderAmount: amount,
            reminderDueDate: dueDate,
            reminderCategory: "Contas",
            reminderRecurring: true,
            reminderRecurringPeriod: "monthly"
          }
        })
        
        return {
          actions,
          response: `🔄 Perfeito! Vou criar o gasto recorrente "${name}" de R$ ${amount.toFixed(2)} para todo dia ${day} e também um lembrete para te avisar antes do vencimento!`
        }
      }
      
      // Só recorrente
      if (isRecurring(text)) {
        actions.push({
          type: "create_recurring",
          data: {
            recurringType: "EXPENSE",
            recurringDescription: name,
            recurringAmount: amount,
            recurringDay: day,
            recurringFrequency: "MONTHLY"
          }
        })
        
        return {
          actions,
          response: `🔄 Vou criar o gasto recorrente "${name}" de R$ ${amount.toFixed(2)} para todo dia ${day}. Assim você não esquece de considerar no seu orçamento!`
        }
      }
      
      // Só lembrete
      if (isReminder(text)) {
        actions.push({
          type: "create_reminder",
          data: {
            reminderName: name,
            reminderAmount: amount,
            reminderDueDate: dueDate,
            reminderCategory: "Contas"
          }
        })
        
        return {
          actions,
          response: `🔔 Vou criar um lembrete para "${name}" de R$ ${amount.toFixed(2)} para o dia ${dueDate}. Você será notificado antes do vencimento!`
        }
      }
    }
  }
  
  // === RECEITA ===
  if (isIncome(text)) {
    const amount = extractAmount(originalText)
    
    let description = "Receita"
    const descKeywords = [
      { keys: ["freelancer", "freela"], desc: "Trabalho Freelancer" },
      { keys: ["salario", "salário"], desc: "Salário" },
      { keys: ["venda", "vendi"], desc: "Venda" },
      { keys: ["comissao", "comissão"], desc: "Comissão" },
      { keys: ["bonus", "bônus"], desc: "Bônus" },
      { keys: ["aluguel"], desc: "Aluguel Recebido" },
      { keys: ["rendimento", "rendimento"], desc: "Rendimento" }
    ]
    
    for (const item of descKeywords) {
      if (item.keys.some(k => text.includes(k))) {
        description = item.desc
        break
      }
    }
    
    if (amount) {
      actions.push({
        type: "create_transaction",
        data: {
          transactionType: "INCOME",
          transactionDescription: description,
          transactionAmount: amount,
          transactionDate: today.toISOString().split('T')[0]
        }
      })
      
      return {
        actions,
        response: `💰 Parabéns! Vou registrar essa receita de R$ ${amount.toFixed(2)} como "${description}". Seu saldo já vai ser atualizado!`
      }
    }
  }
  
  // === DESPESA ===
  if (isExpense(text)) {
    const amount = extractAmount(originalText)
    
    let description = "Despesa"
    const descKeywords = [
      { keys: ["mercado", "supermercado"], desc: "Mercado" },
      { keys: ["almoço", "almoco", "comida", "restaurante"], desc: "Alimentação" },
      { keys: ["gasolina", "combustivel", "posto"], desc: "Combustível" },
      { keys: ["uber", "99", "taxi"], desc: "Transporte" },
      { keys: ["farmacia", "remedio", "remédio"], desc: "Farmácia" },
      { keys: ["roupa", "shopping"], desc: "Roupas" }
    ]
    
    for (const item of descKeywords) {
      if (item.keys.some(k => text.includes(k))) {
        description = item.desc
        break
      }
    }
    
    if (amount) {
      actions.push({
        type: "create_transaction",
        data: {
          transactionType: "EXPENSE",
          transactionDescription: description,
          transactionAmount: amount,
          transactionDate: today.toISOString().split('T')[0]
        }
      })
      
      return {
        actions,
        response: `📝 Registrei essa despesa de R$ ${amount.toFixed(2)} como "${description}".`
      }
    }
  }
  
  // === CONVERSA GERAL ===
  if (text.includes("oi") || text.includes("ola") || text.includes("bom dia") || text.includes("boa tarde") || text.includes("boa noite")) {
    return {
      actions: [{ type: "general_chat", data: {} }],
      response: `Olá! 👋 Sou seu assistente financeiro do Monetra. Posso te ajudar com:\n\n• Criar metas financeiras\n• Criar lembretes de contas\n• Configurar gastos recorrentes\n• Registrar receitas e despesas\n• Consultar seu saldo\n\nO que você gostaria de fazer?`
    }
  }
  
  if (text.includes("ajuda") || text.includes("help") || text.includes("como funciona")) {
    return {
      actions: [{ type: "general_chat", data: {} }],
      response: `Aqui está o que posso fazer por você! 🎯\n\n**📋 Metas:**\n"Criar meta de 5000 reais para viagem"\n"Quero juntar 1000 reais para emergência"\n\n**🔔 Lembretes:**\n"Crie lembrete para conta de luz dia 15 valor 150"\n"Me avisa para pagar o aluguel dia 10"\n\n**🔄 Gastos Recorrentes:**\n"Criar gasto recorrente Netflix 55 reais dia 10"\n"Adicionar assinatura Spotify 20 reais"\n\n**💰 Receitas:**\n"Recebi 500 reais de freelancer"\n"Adicionar renda de 200 reais"\n\n**📝 Despesas:**\n"Gastei 50 reais no mercado"\n"Paguei 30 reais de almoço"\n\n**📊 Consultas:**\n"Qual meu saldo?"\n\n**Dica:** Se você pedir algo como "criar lembrete recorrente para aluguel", eu crio AMBOS o gasto recorrente E o lembrete!`
    }
  }
  
  if (text.includes("dica") || text.includes("economizar") || text.includes("poupar")) {
    return {
      actions: [{ type: "general_chat", data: {} }],
      response: `Aqui vão algumas dicas financeiras! 💡\n\n1️⃣ **Regra 50-30-20**: 50% para necessidades, 30% para desejos, 20% para poupança\n\n2️⃣ **Reserva de emergência**: Tente guardar 6-12 meses de despesas\n\n3️⃣ **Anote tudo**: Registrar gastos ajuda a controlar\n\n4️⃣ **Revise assinaturas**: Cancele o que não usa\n\n5️⃣ **Compare preços**: Pesquise antes de comprar\n\n6️⃣ **Metas claras**: Defina objetivos específicos\n\n7️⃣ **Evite impulsos**: Espere 24h antes de compras grandes\n\nQuer que eu ajude a criar uma meta de economia?`
    }
  }
  
  // Resposta padrão
  return {
    actions: [{ type: "general_chat", data: {} }],
    response: `Não entendi muito bem. 🤔\n\nTente algo como:\n• "Criar meta de 1000 reais para emergência"\n• "Criar lembrete recorrente para aluguel 400 reais dia 15"\n• "Recebi 500 reais de freelancer"\n• "Qual meu saldo?"\n\nOu digite "ajuda" para ver tudo que posso fazer!`
  }
}

// Executar ação no banco de dados
async function executeAction(userId: string, action: Action): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    switch (action.type) {
      case "create_reminder": {
        const { reminderName, reminderAmount, reminderDueDate, reminderCategory, reminderRecurring, reminderRecurringPeriod } = action.data
        
        const reminder = await db.billReminder.create({
          data: {
            userId,
            name: reminderName,
            amount: reminderAmount,
            dueDate: new Date(reminderDueDate),
            category: reminderCategory || "Outros",
            isRecurring: reminderRecurring || false,
            recurringPeriod: reminderRecurringPeriod,
            remindDays: 3
          }
        })
        
        return { success: true, data: reminder, message: "Lembrete criado!" }
      }
      
      case "create_recurring": {
        const { recurringType, recurringDescription, recurringAmount, recurringDay, recurringFrequency } = action.data
        
        const nextDueDate = new Date()
        nextDueDate.setDate(recurringDay)
        if (nextDueDate <= new Date()) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
        }
        
        const recurring = await db.recurringTransaction.create({
          data: {
            userId,
            type: recurringType as TransactionType,
            description: recurringDescription,
            amount: recurringAmount,
            dayOfMonth: recurringDay,
            frequency: recurringFrequency as RecurringFrequency,
            startDate: new Date(),
            nextDueDate,
            isActive: true,
            autoCreate: true,
            notifyBefore: 3
          }
        })
        
        return { success: true, data: recurring, message: "Gasto recorrente criado!" }
      }
      
      case "create_transaction": {
        const { transactionType, transactionDescription, transactionAmount, transactionDate } = action.data
        
        const defaultAccount = await db.financialAccount.findFirst({
          where: { userId, isDefault: true }
        })
        
        const category = await db.category.findFirst({
          where: { isDefault: true, type: transactionType as TransactionType }
        })
        
        const transaction = await db.transaction.create({
          data: {
            userId,
            type: transactionType as TransactionType,
            description: transactionDescription,
            amount: transactionAmount,
            date: new Date(transactionDate),
            accountId: defaultAccount?.id,
            categoryId: category?.id,
            isPaid: true
          }
        })
        
        if (defaultAccount) {
          const balanceChange = transactionType === "INCOME" ? transactionAmount : -transactionAmount
          await db.financialAccount.update({
            where: { id: defaultAccount.id },
            data: { balance: { increment: balanceChange } }
          })
        }
        
        return { success: true, data: transaction, message: "Transação registrada!" }
      }
      
      case "create_goal": {
        const { goalName, goalTargetAmount, goalTargetDate, goalDescription } = action.data
        
        const goal = await db.goal.create({
          data: {
            userId,
            name: goalName,
            targetAmount: goalTargetAmount,
            targetDate: goalTargetDate ? new Date(goalTargetDate) : null,
            description: goalDescription,
            status: "IN_PROGRESS"
          }
        })
        
        return { success: true, data: goal, message: "Meta criada!" }
      }
      
      case "query_balance": {
        const accounts = await db.financialAccount.findMany({
          where: { userId, isActive: true }
        })
        
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
        
        return { 
          success: true, 
          data: { accounts, totalBalance },
          message: `Saldo: R$ ${totalBalance.toFixed(2)}`
        }
      }
      
      default:
        return { success: true, message: "Ok!" }
    }
  } catch (error) {
    console.error("Error executing action:", error)
    return { success: false, message: "Erro ao executar ação" }
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
    const { message } = body
    
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 })
    }
    
    console.log("Assistant - User:", decoded.id, "Message:", message)
    
    // Processar mensagem
    const { actions, response } = processMessage(message)
    
    // Executar todas as ações
    const results = []
    for (const action of actions) {
      const result = await executeAction(decoded.id, action)
      results.push({ action: action.type, ...result })
    }
    
    // Verificar se todas as ações foram bem sucedidas
    const allSuccess = results.every(r => r.success)
    
    return NextResponse.json({
      success: allSuccess,
      actions: results,
      response
    })
  } catch (error) {
    console.error("Assistant API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
