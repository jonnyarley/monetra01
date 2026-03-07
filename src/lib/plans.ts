// ==================== PLANOS E LIMITES ====================
// Definição de planos, preços e limites do Monetra

import { Plan } from "@prisma/client"

// Produtos do Google Play Console
export const GOOGLE_PLAY_PRODUCTS = {
  BASIC_MONTHLY: "basic_monthly",
  BASIC_YEARLY: "basic_yearly",
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
    name: "Gratuito",
    description: "Perfeito para começar a organizar suas finanças",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    googlePlayProductId: {
      monthly: "",
      yearly: "",
    },
    features: [
      "Até 50 transações/mês",
      "1 conta bancária",
      "1 cartão",
      "1 meta financeira",
      "5 categorias",
      "Calendário financeiro",
      "Mone Score básico",
    ],
    limits: {
      transactionsPerMonth: 50,
      maxAccounts: 1,
      maxCards: 1,
      maxGoals: 1,
      maxBudgets: 0,
      maxCategories: 5,
      maxTags: 5,
      aiReportsPerMonth: 0,
      canExport: false,
      maxBankConnections: 0,
      maxReports: 0,
      supportLevel: "community",
    },
  },

  BASIC: {
    id: "BASIC",
    name: "Básico",
    description: "Ideal para controle financeiro pessoal",
    monthlyPrice: 14.90,
    yearlyPrice: 149.90,
    yearlyDiscount: 16,
    googlePlayProductId: {
      monthly: GOOGLE_PLAY_PRODUCTS.BASIC_MONTHLY,
      yearly: GOOGLE_PLAY_PRODUCTS.BASIC_YEARLY,
    },
    features: [
      "Transações ilimitadas",
      "Até 3 contas bancárias",
      "Até 2 cartões",
      "Até 3 metas financeiras",
      "Até 3 orçamentos",
      "10 categorias",
      "3 relatórios IA/mês",
      "Calendário financeiro",
      "Mone Score completo",
      "Suporte por email",
    ],
    limits: {
      transactionsPerMonth: null,
      maxAccounts: 3,
      maxCards: 2,
      maxGoals: 3,
      maxBudgets: 3,
      maxCategories: 10,
      maxTags: 15,
      aiReportsPerMonth: 3,
      canExport: false,
      maxBankConnections: 1,
      maxReports: 3,
      supportLevel: "email",
    },
  },

  PRO: {
    id: "PRO",
    name: "Premium",
    description: "Para quem leva as finanças a sério",
    monthlyPrice: 24.90,
    yearlyPrice: 249.90,
    yearlyDiscount: 16,
    googlePlayProductId: {
      monthly: GOOGLE_PLAY_PRODUCTS.PRO_MONTHLY,
      yearly: GOOGLE_PLAY_PRODUCTS.PRO_YEARLY,
    },
    highlight: true,
    badge: "Mais Popular",
    features: [
      "Tudo do Básico +",
      "Contas ilimitadas",
      "Cartões ilimitados",
      "Metas ilimitadas",
      "Orçamentos ilimitados",
      "Categorias ilimitadas",
      "10 relatórios IA/mês",
      "Exportar dados (CSV/PDF)",
      "Integração bancária (2 bancos)",
      "Relatórios mensais",
      "Suporte prioritário",
    ],
    limits: {
      transactionsPerMonth: null,
      maxAccounts: 999,
      maxCards: 999,
      maxGoals: 999,
      maxBudgets: 999,
      maxCategories: 999,
      maxTags: 999,
      aiReportsPerMonth: 10,
      canExport: true,
      maxBankConnections: 2,
      maxReports: 12,
      supportLevel: "priority",
    },
  },

  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "Para empresas e times",
    monthlyPrice: 49.90,
    yearlyPrice: 499.90,
    yearlyDiscount: 16,
    googlePlayProductId: {
      monthly: GOOGLE_PLAY_PRODUCTS.BUSINESS_MONTHLY,
      yearly: GOOGLE_PLAY_PRODUCTS.BUSINESS_YEARLY,
    },
    badge: "Para Empresas",
    features: [
      "Tudo do Pro +",
      "Relatórios IA ilimitados",
      "Integração bancária ilimitada",
      "API de integração",
      "Múltiplos usuários (em breve)",
      "Relatórios personalizados",
      "Auditoria completa",
      "Suporte dedicado 24/7",
      "SLA garantido",
      "Treinamento personalizado",
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
  PLANS.BASIC,
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
