import { Plan } from "@prisma/client"

export const PLAN_LIMITS = {
  FREE: {
    name: "Gratuito",
    price: 0,
    transactions: 50,
    accounts: 2,
    cards: 2,
    goals: 3,
    budgets: 3,
    categories: 10,
    recurringTransactions: 3,
    billReminders: 5,
    exports: 3,
    aiCategorization: false,
    advancedReports: false,
    familyMode: false,
    cloudBackup: false,
    importStatements: false,
  },
  BASIC: {
    name: "Basic",
    price: 19.90,
    transactions: 500,
    accounts: 5,
    cards: 5,
    goals: 10,
    budgets: 10,
    categories: 30,
    recurringTransactions: 20,
    billReminders: 20,
    exports: 20,
    aiCategorization: false,
    advancedReports: false,
    familyMode: false,
    cloudBackup: false,
    importStatements: true,
  },
  PRO: {
    name: "Pro",
    price: 29.90,
    transactions: -1, // ilimitado
    accounts: -1,
    cards: -1,
    goals: -1,
    budgets: -1,
    categories: -1,
    recurringTransactions: -1,
    billReminders: -1,
    exports: -1,
    aiCategorization: true,
    advancedReports: true,
    familyMode: false,
    cloudBackup: true,
    importStatements: true,
  },
  BUSINESS: {
    name: "Business",
    price: 49.90,
    transactions: -1,
    accounts: -1,
    cards: -1,
    goals: -1,
    budgets: -1,
    categories: -1,
    recurringTransactions: -1,
    billReminders: -1,
    exports: -1,
    aiCategorization: true,
    advancedReports: true,
    familyMode: true,
    cloudBackup: true,
    importStatements: true,
  }
}

export type PlanLimit = typeof PLAN_LIMITS.FREE

export function getPlanLimits(plan: Plan): PlanLimit {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE
}

export function canUseFeature(plan: Plan, feature: keyof PlanLimit): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  
  return false
}

export function getFeatureLimit(plan: Plan, feature: keyof PlanLimit): number {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  if (typeof value === "number") return value
  return 0
}

export function isFeatureUnlimited(plan: Plan, feature: keyof PlanLimit): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  if (typeof value === "number") return value === -1
  return false
}

// Features que requerem planos específicos
export const FEATURE_REQUIREMENTS: Record<string, Plan[]> = {
  aiCategorization: ["PRO", "BUSINESS"],
  advancedReports: ["PRO", "BUSINESS"],
  familyMode: ["BUSINESS"],
  cloudBackup: ["PRO", "BUSINESS"],
  importStatements: ["BASIC", "PRO", "BUSINESS"],
}

export function getRequiredPlanForFeature(feature: string): Plan | null {
  const plans = FEATURE_REQUIREMENTS[feature]
  if (!plans || plans.length === 0) return null
  return plans[0] as Plan
}
