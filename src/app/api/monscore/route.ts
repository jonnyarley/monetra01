import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

// ==================== 100 INSÍGNIAS DE CONQUISTAS ====================
const BADGES_DEFINITION = [
  // ==================== TRANSAÇÕES (20 insígnias) ====================
  { id: "first_transaction", name: "Primeiro Passo", description: "Registre sua primeira transação", icon: "CreditCard", color: "slate", points: 10, category: "transactions", rarity: "common" },
  { id: "trans_10", name: "Iniciante", description: "Registre 10 transações", icon: "Receipt", color: "slate", points: 20, category: "transactions", rarity: "common" },
  { id: "trans_50", name: "Organizado", description: "Registre 50 transações", icon: "ListTodo", color: "teal", points: 50, category: "transactions", rarity: "common" },
  { id: "trans_100", name: "Disciplinado", description: "Registre 100 transações", icon: "Calendar", color: "teal", points: 100, category: "transactions", rarity: "common" },
  { id: "trans_250", name: "Persistente", description: "Registre 250 transações", icon: "TrendingUp", color: "blue", points: 150, category: "transactions", rarity: "rare" },
  { id: "trans_500", name: "Dedicado", description: "Registre 500 transações", icon: "Award", color: "blue", points: 250, category: "transactions", rarity: "rare" },
  { id: "trans_1000", name: "Mestre dos Registros", description: "Registre 1.000 transações", icon: "Trophy", color: "purple", points: 500, category: "transactions", rarity: "epic" },
  { id: "trans_5000", name: "Lenda Contábil", description: "Registre 5.000 transações", icon: "Crown", color: "amber", points: 1000, category: "transactions", rarity: "legendary" },
  { id: "first_income", name: "Receita Inicial", description: "Registre sua primeira receita", icon: "ArrowUpRight", color: "emerald", points: 15, category: "transactions", rarity: "common" },
  { id: "first_expense", name: "Despesa Inicial", description: "Registre sua primeira despesa", icon: "ArrowDownRight", color: "rose", points: 15, category: "transactions", rarity: "common" },
  { id: "income_10k", name: "Produtivo", description: "Registre R$ 10.000 em receitas totais", icon: "Wallet", color: "emerald", points: 75, category: "transactions", rarity: "common" },
  { id: "income_50k", name: "Próspero", description: "Registre R$ 50.000 em receitas totais", icon: "Banknote", color: "emerald", points: 150, category: "transactions", rarity: "rare" },
  { id: "income_100k", name: "Rico", description: "Registre R$ 100.000 em receitas totais", icon: "Gem", color: "purple", points: 300, category: "transactions", rarity: "epic" },
  { id: "income_500k", name: "Milionário", description: "Registre R$ 500.000 em receitas totais", icon: "Diamond", color: "amber", points: 750, category: "transactions", rarity: "legendary" },
  { id: "categorized_50", name: "Categorizador", description: "Categorize 50 transações", icon: "Tags", color: "cyan", points: 50, category: "transactions", rarity: "common" },
  { id: "categorized_100", name: "Organizador Nato", description: "Categorize 100 transações", icon: "FolderKanban", color: "cyan", points: 100, category: "transactions", rarity: "rare" },
  { id: "first_transfer", name: "Transferidor", description: "Faça sua primeira transferência entre contas", icon: "ArrowLeftRight", color: "blue", points: 25, category: "transactions", rarity: "common" },
  { id: "transfer_10", name: "Mobilizador", description: "Faça 10 transferências entre contas", icon: "Repeat", color: "blue", points: 75, category: "transactions", rarity: "rare" },
  { id: "recurring_5", name: "Recorrente", description: "Crie 5 transações recorrentes", icon: "RefreshCw", color: "violet", points: 100, category: "transactions", rarity: "rare" },
  { id: "installment_10", name: "Parcelador", description: "Registre 10 compras parceladas", icon: "Layers", color: "orange", points: 75, category: "transactions", rarity: "common" },

  // ==================== METAS (15 insígnias) ====================
  { id: "first_goal", name: "Sonhador", description: "Crie sua primeira meta financeira", icon: "Target", color: "emerald", points: 25, category: "goals", rarity: "common" },
  { id: "goals_3", name: "Planejador", description: "Crie 3 metas financeiras", icon: "Flag", color: "emerald", points: 50, category: "goals", rarity: "common" },
  { id: "goals_5", name: "Ambicioso", description: "Crie 5 metas financeiras", icon: "Rocket", color: "blue", points: 75, category: "goals", rarity: "common" },
  { id: "goals_10", name: "Visionário", description: "Crie 10 metas financeiras", icon: "Lightbulb", color: "purple", points: 150, category: "goals", rarity: "rare" },
  { id: "goals_25", name: "Arquiteto de Sonhos", description: "Crie 25 metas financeiras", icon: "Building", color: "amber", points: 300, category: "goals", rarity: "epic" },
  { id: "goal_complete_1", name: "Conquistador", description: "Alcance sua primeira meta", icon: "Medal", color: "emerald", points: 50, category: "goals", rarity: "common" },
  { id: "goal_complete_3", name: "Focado", description: "Alcance 3 metas", icon: "CheckCircle", color: "emerald", points: 100, category: "goals", rarity: "common" },
  { id: "goal_complete_5", name: "Determinado", description: "Alcance 5 metas", icon: "Trophy", color: "purple", points: 200, category: "goals", rarity: "rare" },
  { id: "goal_complete_10", name: "Inconquistável", description: "Alcance 10 metas", icon: "Crown", color: "amber", points: 500, category: "goals", rarity: "legendary" },
  { id: "goal_complete_25", name: "Lenda das Metas", description: "Alcance 25 metas", icon: "Star", color: "amber", points: 1000, category: "goals", rarity: "legendary" },
  { id: "goal_10k", name: "Meta de R$ 10k", description: "Alcance uma meta de R$ 10.000", icon: "CircleDollarSign", color: "blue", points: 100, category: "goals", rarity: "rare" },
  { id: "goal_50k", name: "Meta de R$ 50k", description: "Alcance uma meta de R$ 50.000", icon: "Coins", color: "purple", points: 250, category: "goals", rarity: "epic" },
  { id: "goal_100k", name: "Grande Meta", description: "Alcance uma meta de R$ 100.000", icon: "Gem", color: "amber", points: 500, category: "goals", rarity: "legendary" },
  { id: "goal_quick", name: "Veloz", description: "Alcance uma meta em menos de 30 dias", icon: "Zap", color: "yellow", points: 150, category: "goals", rarity: "rare" },
  { id: "goal_big_progress", name: "Quase Lá", description: "Atinja 90% de progresso em uma meta", icon: "Percent", color: "cyan", points: 50, category: "goals", rarity: "common" },

  // ==================== CONTAS (10 insígnias) ====================
  { id: "first_account", name: "Bancário", description: "Cadastre sua primeira conta", icon: "Building", color: "blue", points: 25, category: "accounts", rarity: "common" },
  { id: "accounts_3", name: "Diversificado", description: "Cadastre 3 contas diferentes", icon: "WalletCards", color: "blue", points: 75, category: "accounts", rarity: "common" },
  { id: "accounts_5", name: "Multi-Conta", description: "Cadastre 5 contas diferentes", icon: "Landmark", color: "purple", points: 150, category: "accounts", rarity: "rare" },
  { id: "account_checking", name: "Correntista", description: "Cadastre uma conta corrente", icon: "Banknote", color: "slate", points: 20, category: "accounts", rarity: "common" },
  { id: "account_savings", name: "Poupador", description: "Cadastre uma conta poupança", icon: "PiggyBank", color: "emerald", points: 20, category: "accounts", rarity: "common" },
  { id: "account_investment", name: "Investidor", description: "Cadastre uma conta de investimento", icon: "TrendingUp", color: "purple", points: 50, category: "accounts", rarity: "rare" },
  { id: "account_wallet", name: "Carteira", description: "Cadastre uma carteira de dinheiro", icon: "Wallet", color: "orange", points: 15, category: "accounts", rarity: "common" },
  { id: "balance_10k", name: "Saldo R$ 10k", description: "Tenha R$ 10.000 em uma conta", icon: "CircleDollarSign", color: "emerald", points: 100, category: "accounts", rarity: "rare" },
  { id: "balance_50k", name: "Saldo R$ 50k", description: "Tenha R$ 50.000 em uma conta", icon: "Coins", color: "purple", points: 250, category: "accounts", rarity: "epic" },
  { id: "balance_100k", name: "Saldo R$ 100k", description: "Tenha R$ 100.000 em uma conta", icon: "Gem", color: "amber", points: 500, category: "accounts", rarity: "legendary" },

  // ==================== CARTÕES (8 insígnias) ====================
  { id: "first_card", name: "Cartão na Carteira", description: "Cadastre seu primeiro cartão", icon: "CreditCard", color: "violet", points: 25, category: "cards", rarity: "common" },
  { id: "cards_3", name: "Múltiplos Cartões", description: "Cadastre 3 cartões", icon: "Wallet", color: "violet", points: 75, category: "cards", rarity: "common" },
  { id: "cards_5", name: "Carteiro", description: "Cadastre 5 cartões", icon: "BadgeCheck", color: "purple", points: 150, category: "cards", rarity: "rare" },
  { id: "card_credit", name: "Credenciado", description: "Cadastre um cartão de crédito", icon: "CreditCard", color: "rose", points: 25, category: "cards", rarity: "common" },
  { id: "card_debit", name: "Débito Ativo", description: "Cadastre um cartão de débito", icon: "Banknote", color: "blue", points: 25, category: "cards", rarity: "common" },
  { id: "card_expense_10", name: "Gastador", description: "Registre 10 compras no cartão", icon: "ShoppingCart", color: "rose", points: 50, category: "cards", rarity: "common" },
  { id: "card_limit_50", name: "Metade do Limite", description: "Use 50% do limite do cartão", icon: "Gauge", color: "yellow", points: 50, category: "cards", rarity: "common" },
  { id: "card_zero_debt", name: "Sem Dívidas", description: "Zere a fatura do cartão por 3 meses seguidos", icon: "CheckCircle", color: "emerald", points: 200, category: "cards", rarity: "epic" },

  // ==================== SEQUÊNCIA/STREAK (6 insígnias) ====================
  { id: "streak_3", name: "Início da Jornada", description: "Use o app por 3 dias seguidos", icon: "Flame", color: "orange", points: 25, category: "streaks", rarity: "common" },
  { id: "streak_7", name: "Constante", description: "Use o app por 7 dias seguidos", icon: "Flame", color: "orange", points: 50, category: "streaks", rarity: "common" },
  { id: "streak_30", name: "Dedicado", description: "Use o app por 30 dias seguidos", icon: "Zap", color: "yellow", points: 200, category: "streaks", rarity: "rare" },
  { id: "streak_90", name: "Três Meses", description: "Use o app por 90 dias seguidos", icon: "Trophy", color: "purple", points: 500, category: "streaks", rarity: "epic" },
  { id: "streak_180", name: "Meio Ano", description: "Use o app por 180 dias seguidos", icon: "Crown", color: "amber", points: 750, category: "streaks", rarity: "legendary" },
  { id: "streak_365", name: "Lendário", description: "Use o app por 365 dias seguidos", icon: "Star", color: "amber", points: 1500, category: "streaks", rarity: "legendary" },

  // ==================== CALENDÁRIO (5 insígnias) ====================
  { id: "calendar_view", name: "Planejador", description: "Visualize o calendário pela primeira vez", icon: "Calendar", color: "blue", points: 10, category: "calendar", rarity: "common" },
  { id: "calendar_month", name: "Mensal", description: "Visualize todos os dias de um mês", icon: "CalendarDays", color: "blue", points: 50, category: "calendar", rarity: "common" },
  { id: "calendar_year", name: "Anual", description: "Visualize todos os meses de um ano", icon: "CalendarRange", color: "purple", points: 150, category: "calendar", rarity: "rare" },
  { id: "calendar_daily_check", name: "Diário", description: "Consulte o calendário por 7 dias seguidos", icon: "CalendarCheck", color: "emerald", points: 75, category: "calendar", rarity: "rare" },
  { id: "calendar_transaction", name: "Marcador", description: "Tenha transações em 20 dias diferentes", icon: "MapPin", color: "teal", points: 100, category: "calendar", rarity: "rare" },

  // ==================== RELATÓRIOS/IA (5 insígnias) ====================
  { id: "first_report", name: "Analista", description: "Gere seu primeiro relatório", icon: "FileText", color: "cyan", points: 50, category: "reports", rarity: "common" },
  { id: "report_5", name: "Estudioso", description: "Gere 5 relatórios", icon: "BarChart3", color: "cyan", points: 100, category: "reports", rarity: "common" },
  { id: "report_monthly", name: "Mensal", description: "Gere relatórios por 3 meses seguidos", icon: "LineChart", color: "purple", points: 150, category: "reports", rarity: "rare" },
  { id: "ai_insight", name: "IA Explorador", description: "Use insights de IA pela primeira vez", icon: "Sparkles", color: "violet", points: 75, category: "reports", rarity: "rare" },
  { id: "ai_master", name: "Mestre da IA", description: "Use 50 insights de IA", icon: "Brain", color: "amber", points: 300, category: "reports", rarity: "epic" },

  // ==================== ESPECIAIS (5 insígnias) ====================
  { id: "early_bird", name: "Early Bird", description: "Crie sua conta nos primeiros 1.000 usuários", icon: "Bird", color: "cyan", points: 100, category: "special", rarity: "rare" },
  { id: "beta_tester", name: "Beta Tester", description: "Use o app durante o período beta", icon: "FlaskConical", color: "purple", points: 200, category: "special", rarity: "epic" },
  { id: "pro_member", name: "Membro Pro", description: "Seja um assinante Pro", icon: "Crown", color: "amber", points: 150, category: "special", rarity: "rare" },
  { id: "anniversary_1", name: "1 Ano de Monetra", description: "Complete 1 ano usando o app", icon: "Cake", color: "pink", points: 300, category: "special", rarity: "epic" },
  { id: "night_owl", name: "Coruja Noturna", description: "Use o app depois das 2h da manhã", icon: "Moon", color: "indigo", points: 50, category: "special", rarity: "rare" },
]

// Níveis disponíveis
export const LEVELS = [
  { name: "Iniciante", minScore: 0, maxScore: 100, level: 1 },
  { name: "Aprendiz", minScore: 101, maxScore: 250, level: 2 },
  { name: "Intermediário", minScore: 251, maxScore: 500, level: 3 },
  { name: "Avançado", minScore: 501, maxScore: 750, level: 4 },
  { name: "Expert", minScore: 751, maxScore: 900, level: 5 },
  { name: "Mestre", minScore: 901, maxScore: 1000, level: 6 },
]

// Garantir que os achievements existam no banco
async function ensureAchievementsExist() {
  try {
    // Criar achievements em lotes para evitar timeout
    const batchSize = 20
    for (let i = 0; i < BADGES_DEFINITION.length; i += batchSize) {
      const batch = BADGES_DEFINITION.slice(i, i + batchSize)
      for (const badge of batch) {
        try {
          await db.achievement.upsert({
            where: { id: badge.id },
            create: {
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              points: badge.points,
              category: badge.category,
            },
            update: {
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              points: badge.points,
              category: badge.category,
            }
          })
        } catch (e) {
          // Ignorar erros individuais
        }
      }
    }
    console.log(`[MONE_SCORE] ✅ ${BADGES_DEFINITION.length} achievements verificados/criados`)
  } catch (error) {
    console.error("[MONE_SCORE] Erro ao criar achievements:", error)
  }
}

// Função para verificar e atribuir conquistas automaticamente
export async function checkAndAwardBadges(userId: string): Promise<{ newBadges: string[], totalPoints: number }> {
  const newBadges: string[] = []
  
  try {
    // Garantir que achievements existam
    await ensureAchievementsExist()
    
    // Buscar conquistas já existentes
    let existingAchievements: { achievementId: string }[] = []
    try {
      existingAchievements = await db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      })
    } catch (e) {
      console.log("[MONE_SCORE] Tabela userAchievement pode não existir ainda")
    }
    const existingIds = new Set(existingAchievements.map(a => a.achievementId))
    
    // Buscar estatísticas do usuário com tratamento de erro individual
    let transactionCount = 0
    let totalIncome = 0
    let expenseCount = 0
    let goalsCount = 0
    let completedGoalsCount = 0
    let accountsCount = 0
    let cardsCount = 0
    let recurringCount = 0
    let categorizedCount = 0
    
    try {
      transactionCount = await db.transaction.count({ where: { userId } })
    } catch (e) {}
    
    try {
      const incomeAgg = await db.transaction.aggregate({ 
        where: { userId, type: "INCOME" }, 
        _sum: { amount: true } 
      })
      totalIncome = Number(incomeAgg._sum.amount || 0)
    } catch (e) {}
    
    try {
      expenseCount = await db.transaction.count({ where: { userId, type: "EXPENSE" } })
    } catch (e) {}
    
    try {
      goalsCount = await db.goal.count({ where: { userId } })
    } catch (e) {}
    
    try {
      completedGoalsCount = await db.goal.count({ where: { userId, status: "COMPLETED" } })
    } catch (e) {}
    
    try {
      accountsCount = await db.financialAccount.count({ where: { userId, isActive: true } })
    } catch (e) {}
    
    try {
      cardsCount = await db.card.count({ where: { userId, isActive: true } })
    } catch (e) {}
    
    try {
      recurringCount = await db.recurringTransaction.count({ where: { userId, isActive: true } })
    } catch (e) {}
    
    try {
      categorizedCount = await db.transaction.count({ where: { userId, categoryId: { not: null } } })
    } catch (e) {}
    
    console.log(`[MONE_SCORE] Stats for ${userId}:`, {
      transactionCount,
      totalIncome,
      expenseCount,
      goalsCount,
      completedGoalsCount,
      accountsCount,
      cardsCount,
      recurringCount,
      categorizedCount
    })
    
    // Definir condições para cada badge
    const badgeConditions: Record<string, boolean> = {
      // Transações
      "first_transaction": transactionCount >= 1,
      "trans_10": transactionCount >= 10,
      "trans_50": transactionCount >= 50,
      "trans_100": transactionCount >= 100,
      "trans_250": transactionCount >= 250,
      "trans_500": transactionCount >= 500,
      "trans_1000": transactionCount >= 1000,
      "trans_5000": transactionCount >= 5000,
      "first_income": totalIncome > 0,
      "first_expense": expenseCount >= 1,
      "income_10k": totalIncome >= 10000,
      "income_50k": totalIncome >= 50000,
      "income_100k": totalIncome >= 100000,
      "income_500k": totalIncome >= 500000,
      "categorized_50": categorizedCount >= 50,
      "categorized_100": categorizedCount >= 100,
      "recurring_5": recurringCount >= 5,
      
      // Metas
      "first_goal": goalsCount >= 1,
      "goals_3": goalsCount >= 3,
      "goals_5": goalsCount >= 5,
      "goals_10": goalsCount >= 10,
      "goals_25": goalsCount >= 25,
      "goal_complete_1": completedGoalsCount >= 1,
      "goal_complete_3": completedGoalsCount >= 3,
      "goal_complete_5": completedGoalsCount >= 5,
      "goal_complete_10": completedGoalsCount >= 10,
      "goal_complete_25": completedGoalsCount >= 25,
      
      // Contas
      "first_account": accountsCount >= 1,
      "accounts_3": accountsCount >= 3,
      "accounts_5": accountsCount >= 5,
      
      // Cartões
      "first_card": cardsCount >= 1,
      "cards_3": cardsCount >= 3,
      "cards_5": cardsCount >= 5,
    }
    
    // Criar novas conquistas
    for (const badge of BADGES_DEFINITION) {
      if (!existingIds.has(badge.id) && badgeConditions[badge.id]) {
        try {
          await db.userAchievement.create({
            data: {
              userId,
              achievementId: badge.id
            }
          })
          newBadges.push(badge.id)
          console.log(`[MONE_SCORE] ✅ Badge conquistada: ${badge.name} (+${badge.points} pts)`)
        } catch (err) {
          // Ignorar erro se já existe (race condition)
          console.log(`[MONE_SCORE] Badge já existe ou erro: ${badge.id}`)
        }
      }
    }
    
    // Calcular total de pontos baseado nas conquistas
    const allAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true }
    })
    
    let totalPoints = 0
    for (const achievement of allAchievements) {
      const badge = BADGES_DEFINITION.find(b => b.id === achievement.achievementId)
      if (badge) {
        totalPoints += badge.points
      }
    }
    
    console.log(`[MONE_SCORE] Total: ${allAchievements.length} conquistas, ${totalPoints} pontos`)
    
    return { newBadges, totalPoints }
    
  } catch (error) {
    console.error("[MONE_SCORE] Erro ao verificar conquistas:", error)
    return { newBadges: [], totalPoints: 0 }
  }
}

// GET - Buscar dados do Mone Score
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
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
    }

    // Verificar e atribuir novas conquistas
    const { newBadges, totalPoints } = await checkAndAwardBadges(decoded.id)
    
    // Determinar nível baseado nos pontos
    const currentLevel = LEVELS.find(l => totalPoints >= l.minScore && totalPoints <= l.maxScore) || LEVELS[0]
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1]
    
    // Score máximo é 1000
    const score = Math.min(totalPoints, 1000)
    
    // Atualizar usuário com os valores corretos
    try {
      await db.user.update({
        where: { id: decoded.id },
        data: {
          financialScore: score,
          totalPoints: totalPoints,
          level: currentLevel.level
        }
      })
    } catch (e) {
      console.log("[MONE_SCORE] Erro ao atualizar usuário:", e)
    }

    // Buscar conquistas do usuário
    let userAchievements: { achievementId: string; earnedAt: Date }[] = []
    try {
      userAchievements = await db.userAchievement.findMany({
        where: { userId: decoded.id },
        select: { achievementId: true, earnedAt: true }
      })
    } catch (e) {
      console.log("[MONE_SCORE] Erro ao buscar conquistas:", e)
    }
    const earnedBadgeIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Buscar estatísticas com tratamento de erro
    let completedGoals = 0
    let transactionCount = 0
    let totalSavings = 0
    
    try {
      completedGoals = await db.goal.count({ where: { userId: decoded.id, status: "COMPLETED" } })
    } catch (e) {}
    
    try {
      transactionCount = await db.transaction.count({ where: { userId: decoded.id } })
    } catch (e) {}
    
    try {
      const incomeAgg = await db.transaction.aggregate({
        where: { userId: decoded.id, type: "INCOME" },
        _sum: { amount: true }
      })
      const expenseAgg = await db.transaction.aggregate({
        where: { userId: decoded.id, type: "EXPENSE" },
        _sum: { amount: true }
      })
      totalSavings = Number(incomeAgg._sum.amount || 0) - Number(expenseAgg._sum.amount || 0)
    } catch (e) {}

    // Mapear badges
    const badges = BADGES_DEFINITION.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: `text-${badge.color}-500`,
      bgColor: `bg-${badge.color}-500/20`,
      points: badge.points,
      category: badge.category,
      rarity: badge.rarity as "common" | "rare" | "epic" | "legendary",
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: userAchievements.find(ua => ua.achievementId === badge.id)?.earnedAt || null
    }))

    return NextResponse.json({
      score,
      totalPoints,
      level: currentLevel.level,
      levelName: currentLevel.name,
      nextLevel: nextLevel?.name || null,
      levelProgress: nextLevel 
        ? ((totalPoints - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
        : 100,
      badges,
      earnedBadgesCount: earnedBadgeIds.size,
      totalBadges: BADGES_DEFINITION.length,
      newBadges,
      stats: {
        completedGoals,
        transactionCount,
        totalSavings,
        streakDays: 0
      }
    })

  } catch (error) {
    console.error("Get monscore error:", error)
    return NextResponse.json({ error: "Erro ao carregar mone score" }, { status: 500 })
  }
}

// POST - Recalcular score manualmente
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Verificar e atribuir conquistas
    const { newBadges, totalPoints } = await checkAndAwardBadges(decoded.id)
    
    // Determinar nível
    const currentLevel = LEVELS.find(l => totalPoints >= l.minScore && totalPoints <= l.maxScore) || LEVELS[0]
    const score = Math.min(totalPoints, 1000)
    
    // Atualizar usuário
    await db.user.update({
      where: { id: decoded.id },
      data: {
        financialScore: score,
        totalPoints: totalPoints,
        level: currentLevel.level
      }
    })

    return NextResponse.json({
      success: true,
      score,
      totalPoints,
      level: currentLevel.level,
      levelName: currentLevel.name,
      newBadges,
      newBadgesCount: newBadges.length
    })

  } catch (error) {
    console.error("Recalculate monscore error:", error)
    return NextResponse.json({ error: "Erro ao recalcular score" }, { status: 500 })
  }
}
