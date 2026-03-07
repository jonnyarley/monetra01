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
  { id: "categorized_all", name: "Categorizador", description: "Categorize 50 transações", icon: "Tags", color: "cyan", points: 50, category: "transactions", rarity: "common" },
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

  // ==================== ECONOMIA/POUPANÇA (15 insígnias) ====================
  { id: "first_savings", name: "Poupador", description: "Economize seu primeiro R$ 1.000", icon: "PiggyBank", color: "emerald", points: 75, category: "savings", rarity: "common" },
  { id: "savings_5k", name: "Acumulador", description: "Economize R$ 5.000 no total", icon: "Wallet", color: "emerald", points: 100, category: "savings", rarity: "common" },
  { id: "savings_10k", name: "Investidor", description: "Economize R$ 10.000 no total", icon: "Briefcase", color: "blue", points: 150, category: "savings", rarity: "rare" },
  { id: "savings_25k", name: "Construtor", description: "Economize R$ 25.000 no total", icon: "Building2", color: "blue", points: 250, category: "savings", rarity: "rare" },
  { id: "savings_50k", name: "Milionário", description: "Economize R$ 50.000 no total", icon: "Diamond", color: "purple", points: 400, category: "savings", rarity: "epic" },
  { id: "savings_100k", name: "Cem Mil", description: "Economize R$ 100.000 no total", icon: "Crown", color: "amber", points: 750, category: "savings", rarity: "legendary" },
  { id: "savings_500k", name: "Meio Milhão", description: "Economize R$ 500.000 no total", icon: "Castle", color: "amber", points: 1500, category: "savings", rarity: "legendary" },
  { id: "savings_month_1", name: "Mês Positivo", description: "Tenha saldo positivo por 1 mês", icon: "TrendingUp", color: "emerald", points: 50, category: "savings", rarity: "common" },
  { id: "savings_month_3", name: "Trimestre Verde", description: "Tenha saldo positivo por 3 meses seguidos", icon: "CalendarCheck", color: "emerald", points: 150, category: "savings", rarity: "rare" },
  { id: "savings_month_6", name: "Semestre Perfeito", description: "Tenha saldo positivo por 6 meses seguidos", icon: "Award", color: "purple", points: 300, category: "savings", rarity: "epic" },
  { id: "savings_month_12", name: "Ano Dourado", description: "Tenha saldo positivo por 12 meses seguidos", icon: "Trophy", color: "amber", points: 600, category: "savings", rarity: "legendary" },
  { id: "save_10_percent", name: "Economizador 10%", description: "Economize 10% da receita em um mês", icon: "Percent", color: "teal", points: 50, category: "savings", rarity: "common" },
  { id: "save_20_percent", name: "Economizador 20%", description: "Economize 20% da receita em um mês", icon: "PieChart", color: "blue", points: 100, category: "savings", rarity: "rare" },
  { id: "save_30_percent", name: "Economizador 30%", description: "Economize 30% da receita em um mês", icon: "BarChart", color: "purple", points: 200, category: "savings", rarity: "epic" },
  { id: "save_50_percent", name: "Mestre da Economia", description: "Economize 50% da receita em um mês", icon: "Crown", color: "amber", points: 500, category: "savings", rarity: "legendary" },

  // ==================== ORÇAMENTOS (10 insígnias) ====================
  { id: "first_budget", name: "Planejador", description: "Crie seu primeiro orçamento", icon: "Calculator", color: "blue", points: 25, category: "budgets", rarity: "common" },
  { id: "budget_3", name: "Organizado", description: "Crie 3 orçamentos em um mês", icon: "LayoutGrid", color: "blue", points: 50, category: "budgets", rarity: "common" },
  { id: "budget_5", name: "Estrategista", description: "Crie 5 orçamentos em um mês", icon: "Network", color: "purple", points: 100, category: "budgets", rarity: "rare" },
  { id: "budget_complete", name: "Cumpri Orçamento", description: "Fique dentro do orçamento por 1 mês", icon: "CheckCircle", color: "emerald", points: 75, category: "budgets", rarity: "common" },
  { id: "budget_3_months", name: "Mestre do Orçamento", description: "Fique dentro do orçamento por 3 meses seguidos", icon: "Shield", color: "purple", points: 200, category: "budgets", rarity: "epic" },
  { id: "budget_6_months", name: "Controlador", description: "Fique dentro do orçamento por 6 meses seguidos", icon: "ShieldCheck", color: "amber", points: 400, category: "budgets", rarity: "legendary" },
  { id: "budget_below_80", name: "Econômico", description: "Use menos de 80% do orçamento", icon: "TrendingDown", color: "emerald", points: 100, category: "budgets", rarity: "rare" },
  { id: "budget_below_50", name: "Super Econômico", description: "Use menos de 50% do orçamento", icon: "BadgePercent", color: "purple", points: 200, category: "budgets", rarity: "epic" },
  { id: "budget_all_categories", name: "Completo", description: "Crie orçamentos para todas as categorias", icon: "Grid3X3", color: "blue", points: 150, category: "budgets", rarity: "rare" },
  { id: "budget_yearly", name: "Planejador Anual", description: "Crie um orçamento anual", icon: "CalendarDays", color: "cyan", points: 100, category: "budgets", rarity: "rare" },

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

  // ==================== SEQUÊNCIA/STREAK (7 insígnias) ====================
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
const LEVELS = [
  { name: "Iniciante", minScore: 0, maxScore: 100 },
  { name: "Aprendiz", minScore: 101, maxScore: 250 },
  { name: "Intermediário", minScore: 251, maxScore: 500 },
  { name: "Avançado", minScore: 501, maxScore: 750 },
  { name: "Expert", minScore: 751, maxScore: 900 },
  { name: "Mestre", minScore: 901, maxScore: 1000 },
]

// GET - Buscar dados do Mone Score do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Buscar dados do usuário
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        financialScore: true,
        totalPoints: true,
        level: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Buscar conquistas do usuário
    const userAchievements = await db.userAchievement.findMany({
      where: { userId: decoded.id },
      select: {
        id: true,
        achievementId: true,
        earnedAt: true
      }
    })

    // Buscar metas concluídas
    const completedGoals = await db.goal.count({
      where: { 
        userId: decoded.id, 
        status: "COMPLETED" 
      }
    })

    // Buscar transações
    const transactionCount = await db.transaction.count({
      where: { userId: decoded.id }
    })

    // Calcular total economizado (saldo positivo de todas as contas)
    const accounts = await db.financialAccount.findMany({
      where: { userId: decoded.id, isActive: true },
      select: { id: true, initialBalance: true }
    })

    let totalSavings = 0
    for (const account of accounts) {
      const income = await db.transaction.aggregate({
        where: { accountId: account.id, type: "INCOME" },
        _sum: { amount: true }
      })
      const expense = await db.transaction.aggregate({
        where: { accountId: account.id, type: "EXPENSE" },
        _sum: { amount: true }
      })
      totalSavings += account.initialBalance + (income._sum.amount || 0) - (expense._sum.amount || 0)
    }

    // Calcular streak de dias consecutivos usando o app
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentLogins = await db.auditLog.findMany({
      where: {
        userId: decoded.id,
        action: "LOGIN",
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true }
    })

    // Calcular dias únicos com login
    const loginDays = new Set(
      recentLogins.map(log => log.createdAt.toISOString().split('T')[0])
    )

    // Mapear conquistas ganhas
    const earnedBadgeIds = new Set(userAchievements.map(ua => ua.achievementId))
    
    // Determinar badges
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

    // Determinar nível atual
    const currentLevel = LEVELS.find(l => 
      user.financialScore >= l.minScore && user.financialScore <= l.maxScore
    ) || LEVELS[0]

    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1]

    return NextResponse.json({
      score: user.financialScore,
      totalPoints: user.totalPoints,
      level: user.level,
      levelName: currentLevel.name,
      nextLevel: nextLevel?.name || null,
      levelProgress: nextLevel 
        ? ((user.financialScore - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
        : 100,
      badges,
      earnedBadgesCount: earnedBadgeIds.size,
      totalBadges: BADGES_DEFINITION.length,
      stats: {
        completedGoals,
        transactionCount,
        totalSavings,
        streakDays: loginDays.size
      }
    })

  } catch (error) {
    console.error("Get monscore error:", error)
    return NextResponse.json({ error: "Erro ao carregar mone score" }, { status: 500 })
  }
}
