// ==================== PLANOS E LIMITES ====================
// Definição de planos, preços e limites do Monetra

import { Plan } from "@prisma/client"

// Produtos do Google Play Console
export const GOOGLE_PLAY_PRODUCTS = {
  PRO_MONTHLY: "pro_monthly",
  PRO_YEARLY: "pro_yearly",
  BUSINESS_MONTHLY: "business_monthly",
  BUSINESS_YEARLY: "business_yearly",
} as const

// Definição de cada plano
export interface PlanDefinition {
  id: Plan
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyDiscount: number // Porcentagem de desconto
  googlePlayProductId: {
    monthly: string
    yearly: string
  }
  features: string[]
  limits: PlanLimits
  highlight?: boolean
  badge?: string
}

// Limites por plano
export interface PlanLimits {
  // Transações
  transactionsPerMonth: number | null // null = ilimitado
  
  // Contas financeiras
  maxAccounts: number
  
  // Cartões
  maxCards: number
  
  // Metas
  maxGoals: number
  
  // Orçamentos
  maxBudgets: number
  
  // Categorias
  maxCategories: number
  
  // Tags
  maxTags: number
  
  // Relatórios IA
  aiReportsPerMonth: number
  
  // Exportação
  canExport: boolean
  
  // Banco integrado
  maxBankConnections: number
  
  // Relatórios
  maxReports: number
  
  // Suporte
  supportLevel: "community" | "email" | "priority" | "dedicated"
}

// Definições completas dos planos
export const PLANS: Record<Plan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Teste Grátis",
    description: "14 dias para experimentar todos os recursos",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    googlePlayProductId: {
      monthly: "",
      yearly: "",
    },
    badge: "14 dias grátis",
    features: [
      "Teste completo por 14 dias",
      "Transações ilimitadas",
      "Contas ilimitadas",
      "Cartões ilimitados",
      "Metas ilimitadas",
      "Orçamentos ilimitados",
      "Assistente Tera IA",
      "Relatórios IA (5/mês)",
      "Mone Score completo",
      "Suporte por email",
    ],
    limits: {
      transactionsPerMonth: null,
      maxAccounts: 999,
      maxCards: 999,
      maxGoals: 999,
      maxBudgets: 999,
      maxCategories: 999,
      maxTags: 999,
      aiReportsPerMonth: 5,
      canExport: true,
      maxBankConnections: 999,
      maxReports: 12,
      supportLevel: "email",
    },
  },

  PRO: {
    id: "PRO",
    name: "Premium",
    description: "Relatórios IA ilimitados + recursos exclusivos",
    monthlyPrice: 19.90,
    yearlyPrice: 199.90,
    yearlyDiscount: 16,
    googlePlayProductId: {
      monthly: GOOGLE_PLAY_PRODUCTS.PRO_MONTHLY,
      yearly: GOOGLE_PLAY_PRODUCTS.PRO_YEARLY,
    },
    highlight: true,
    badge: "Mais Popular",
    features: [
      "Tudo do Gratuito +",
      "Relatórios IA ilimitados",
      "Integração bancária (em breve)",
      "Suporte prioritário VIP",
      "Sem anúncios",
    ],
    limits: {
      transactionsPerMonth: null,
      maxAccounts: 999,
      maxCards: 999,
      maxGoals: 999,
      maxBudgets: 999,
      maxCategories: 999,
      maxTags: 999,
      aiReportsPerMonth: 999,
      canExport: true,
      maxBankConnections: 999,
      maxReports: 999,
      supportLevel: "priority",
    },
  },

  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "Modo Família + todos os recursos",
    monthlyPrice: 49.90,
    yearlyPrice: 499.90,
    yearlyDiscount: 16,
    googlePlayProductId: {
      monthly: GOOGLE_PLAY_PRODUCTS.BUSINESS_MONTHLY,
      yearly: GOOGLE_PLAY_PRODUCTS.BUSINESS_YEARLY,
    },
    badge: "Família",
    features: [
      "Tudo do Premium +",
      "Modo Família completo",
      "Metas em conjunto",
      "Até 5 membros",
      "API de integração (em breve)",
      "Suporte dedicado 24/7",
    ],
    limits: {
      transactionsPerMonth: null,
      maxAccounts: 999,
      maxCards: 999,
      maxGoals: 999,
      maxBudgets: 999,
      maxCategories: 999,
      maxTags: 999,
      aiReportsPerMonth: 999,
      canExport: true,
      maxBankConnections: 999,
      maxReports: 999,
      supportLevel: "dedicated",
    },
  },
}

// Array de planos para iteração (ordem de exibição)
export const PLANS_ARRAY: PlanDefinition[] = [
  PLANS.FREE,
  PLANS.PRO,
  PLANS.BUSINESS,
]

// Planos pagos (exclui FREE)
export const PAID_PLANS = PLANS_ARRAY.filter(p => p.monthlyPrice > 0)

// Função para obter limites do plano
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLANS[plan]?.limits || PLANS.FREE.limits
}

// Função para obter definição do plano
export function getPlanDefinition(plan: Plan): PlanDefinition {
  return PLANS[plan] || PLANS.FREE
}

// Função para verificar se o plano tem um recurso
export function hasFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  return value !== null
}

// Função para verificar limite
export function checkLimit(plan: Plan, feature: keyof PlanLimits, current: number): {
  allowed: boolean
  limit: number | null
  remaining: number | null
} {
  const limits = getPlanLimits(plan)
  const limit = limits[feature]
  
  if (limit === null || typeof limit !== "number") {
    return { allowed: true, limit: null, remaining: null }
  }
  
  return {
    allowed: current < limit,
    limit,
    remaining: Math.max(0, limit - current),
  }
}

// Formatar preço
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)
}

// Calcular economia anual
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  return (monthlyPrice * 12) - yearlyPrice
}
