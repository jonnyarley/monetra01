import { Plan } from "@prisma/client"

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: Plan
  currency: string
  language: string
  theme: string
  financialScore: number
  totalPoints: number
  level: number
  role?: "admin" | "user"
  trialEndsAt?: string | null
  trialExpired?: boolean
  trialDaysLeft?: number
  subscriptionStatus?: string | null
  subscriptionEnd?: string | null
}

export interface FinancialAccount {
  id: string
  name: string
  type: "CHECKING" | "SAVINGS" | "INVESTMENT" | "WALLET" | "OTHER"
  balance: number
  initialBalance: number
  currency: string
  color: string | null
  icon: string | null
  isDefault: boolean
  isActive: boolean
  bankName: string | null
}

export interface Card {
  id: string
  name: string
  type: "CREDIT" | "DEBIT" | "PREPAID"
  brand: string | null
  lastDigits: string | null
  limit: number
  usedLimit: number
  closingDay: number
  dueDay: number
  color: string | null
  isActive: boolean
}

export interface Transaction {
  id: string
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  amount: number
  description: string
  date: Date
  isRecurring: boolean
  recurringPeriod: string | null
  isInstallment: boolean
  installmentTotal: number | null
  installmentCurrent: number | null
  isPaid: boolean
  location: string | null
  notes: string | null
  category: Category | null
  account: FinancialAccount | null
  card: Card | null
  tags: Tag[]
}

export interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  icon: string | null
  color: string | null
  isDefault: boolean
  budget: number | null
}

export interface Tag {
  id: string
  name: string
  color: string | null
}

export interface Goal {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  targetDate: Date | null
  category: string | null
  color: string | null
  icon: string | null
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}

export interface Budget {
  id: string
  name: string
  categoryId: string | null
  amount: number
  spent: number
  period: "WEEKLY" | "MONTHLY" | "YEARLY"
  month: number
  year: number
  alerts: boolean
  alertThreshold: number
  category?: Category
}

export interface Notification {
  id: string
  type: "ALERT" | "REMINDER" | "INFO" | "WARNING" | "SUCCESS"
  title: string
  message: string
  data: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

export interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  cashFlow: number
  previousMonthIncome: number
  previousMonthExpenses: number
  transactions: Transaction[]
  accounts: FinancialAccount[]
  goals: Goal[]
  budgets: Budget[]
  recentTransactions: Transaction[]
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
  monthlyTrend: { month: string; income: number; expense: number }[]
}

export type ViewType = 
  | "dashboard" 
  | "transactions" 
  | "accounts" 
  | "calendar"
  | "goals" 
  | "budgets" 
  | "reports" 
  | "monscore"
  | "settings"
  | "help"
  | "recurring"
  | "reminders"
  | "exports"
  | "family"
  | "assistant"
