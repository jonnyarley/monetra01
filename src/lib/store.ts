import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ViewType, User, FinancialAccount, Card, Transaction, Goal, Budget, Category, Notification } from "@/types"

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  isAdmin: boolean
  currentView: ViewType
  sidebarOpen: boolean
  theme: "light" | "dark" | "system"
  settingsTab: string
  
  // UI State
  
  // Data
  accounts: FinancialAccount[]
  cards: Card[]
  transactions: Transaction[]
  goals: Goal[]
  budgets: Budget[]
  categories: Category[]
  notifications: Notification[]
  
  // Dashboard
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  
  // Auth Actions
  setUser: (user: User | null) => void
  setAuthenticated: (auth: boolean) => void
  setAuthLoading: (loading: boolean) => void
  setIsAdmin: (admin: boolean) => void
  reset: () => void
  
  // UI Actions
  setCurrentView: (view: ViewType) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: "light" | "dark" | "system") => void
  setSettingsTab: (tab: string) => void
  
  // Data Actions
  setAccounts: (accounts: FinancialAccount[]) => void
  setCards: (cards: Card[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setGoals: (goals: Goal[]) => void
  setBudgets: (budgets: Budget[]) => void
  setCategories: (categories: Category[]) => void
  setNotifications: (notifications: Notification[]) => void
  
  // Dashboard Actions
  setTotalBalance: (balance: number) => void
  setMonthlyIncome: (income: number) => void
  setMonthlyExpenses: (expenses: number) => void
  
  // Add/Remove
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  
  addAccount: (account: FinancialAccount) => void
  updateAccount: (id: string, account: Partial<FinancialAccount>) => void
  deleteAccount: (id: string) => void
  
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  
  addBudget: (budget: Budget) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  
  // Reset
  reset: () => void
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  isAdmin: false,
  currentView: "dashboard" as ViewType,
  sidebarOpen: true,
  theme: "system" as "light" | "dark" | "system",
  settingsTab: "profile",
  accounts: [],
  cards: [],
  transactions: [],
  goals: [],
  budgets: [],
  categories: [],
  notifications: [],
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setCurrentView: (currentView) => set({ currentView }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => set({ theme }),
      setSettingsTab: (settingsTab) => set({ settingsTab }),
      
      setAccounts: (accounts) => set({ accounts }),
      setCards: (cards) => set({ cards }),
      setTransactions: (transactions) => set({ transactions }),
      setGoals: (goals) => set({ goals }),
      setBudgets: (budgets) => set({ budgets }),
      setCategories: (categories) => set({ categories }),
      setNotifications: (notifications) => set({ notifications }),
      
      setTotalBalance: (totalBalance) => set({ totalBalance }),
      setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
      setMonthlyExpenses: (monthlyExpenses) => set({ monthlyExpenses }),
      
      addTransaction: (transaction) => set((state) => ({ 
        transactions: [transaction, ...state.transactions] 
      })),
      updateTransaction: (id, updated) => set((state) => ({ 
        transactions: state.transactions.map((t) => 
          t.id === id ? { ...t, ...updated } : t
        ) 
      })),
      deleteTransaction: (id) => set((state) => ({ 
        transactions: state.transactions.filter((t) => t.id !== id) 
      })),
      
      addAccount: (account) => set((state) => ({ 
        accounts: [...state.accounts, account] 
      })),
      updateAccount: (id, updated) => set((state) => ({ 
        accounts: state.accounts.map((a) => 
          a.id === id ? { ...a, ...updated } : a
        ) 
      })),
      deleteAccount: (id) => set((state) => ({ 
        accounts: state.accounts.filter((a) => a.id !== id) 
      })),
      
      addGoal: (goal) => set((state) => ({ 
        goals: [...state.goals, goal] 
      })),
      updateGoal: (id, updated) => set((state) => ({ 
        goals: state.goals.map((g) => 
          g.id === id ? { ...g, ...updated } : g
        ) 
      })),
      deleteGoal: (id) => set((state) => ({ 
        goals: state.goals.filter((g) => g.id !== id) 
      })),
      
      addBudget: (budget) => set((state) => ({ 
        budgets: [...state.budgets, budget] 
      })),
      updateBudget: (id, updated) => set((state) => ({ 
        budgets: state.budgets.map((b) => 
          b.id === id ? { ...b, ...updated } : b
        ) 
      })),
      deleteBudget: (id) => set((state) => ({ 
        budgets: state.budgets.filter((b) => b.id !== id) 
      })),
      
      markNotificationRead: (id) => set((state) => ({ 
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
        ) 
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      reset: () => set(initialState),
    }),
    {
      name: "monetra-storage",
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Export alias for compatibility
export const useStore = useAppStore
