"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Trophy,
  Award,
  Star,
  Target,
  PiggyBank,
  Flame,
  Zap,
  FileSpreadsheet,
  Upload,
  Download,
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

// Helper function to ensure valid numbers for charts (prevents NaN/Infinity SVG errors)
const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  if (!Number.isFinite(num) || isNaN(num)) return defaultValue
  return num
}
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const COLORS = ["#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#fbbf24"]

interface DashboardData {
  overview: {
    totalBalance: number
    monthlyIncome: number
    monthlyExpense: number
    monthlyBalance: number
    incomeChange: number
    expenseChange: number
  }
  accounts: Array<{
    id: string
    name: string
    type: string
    currentBalance: number
    color: string | null
    icon: string | null
  }>
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    date: Date
    isPaid: boolean
    account: { id: string; name: string } | null
    category: { id: string; name: string; icon: string | null; color: string | null } | null
  }>
  categoryExpenses: Array<{
    categoryId: string | null
    categoryName: string
    categoryIcon: string | null
    categoryColor: string | null
    amount: number
  }>
  monthlyData: Array<{
    month: string
    income: number
    expense: number
  }>
  goals: Array<{
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    progress: number
    remaining: number
    targetDate: Date | null
  }>
  monScore?: {
    score: number
    totalPoints: number
    level: number
    levelName: string
    earnedBadgesCount: number
  }
  recurringExpenses?: {
    total: number
    monthly: number
    yearly: number
    weekly: number
    items: Array<{
      id: string
      description: string
      amount: number
      frequency: string
      nextDueDate: Date
      category: { id: string; name: string; icon: string | null; color: string | null } | null
    }>
  }
}

export function DashboardView() {
  const { setCurrentView, user } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success: boolean; message: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDashboardData = async () => {
    try {
      console.log("[DASHBOARD-FRONT] Buscando dados...")
      const response = await fetch("/api/dashboard/")
      console.log("[DASHBOARD-FRONT] Status:", response.status)
      
      const result = await response.json()
      console.log("[DASHBOARD-FRONT] Resposta:", result)
      
      if (!response.ok) {
        console.error("[DASHBOARD-FRONT] Erro da API:", result)
        toast.error(`Erro do servidor: ${result.error || result.message || 'Desconhecido'}`)
        return
      }
      
      setData(result)
    } catch (error) {
      console.error("[DASHBOARD-FRONT] Erro ao buscar:", error)
      toast.error("Erro ao carregar dados do dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Função para importar arquivo
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['.xlsx', '.xls', '.csv', '.ofx']
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validTypes.includes(fileExt)) {
      toast.error('Formato não suportado. Use Excel (.xlsx, .xls), CSV ou OFX')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/imports', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setImportResult({
          success: true,
          message: `Importado com sucesso! ${result.imported} transações, ${result.duplicates} duplicatas ignoradas`
        })
        toast.success(`Importado ${result.imported} transações!`)
        // Atualizar dados do dashboard
        fetchDashboardData()
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Erro ao importar arquivo'
        })
        toast.error(result.error || 'Erro ao importar arquivo')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setImportResult({
        success: false,
        message: 'Erro ao conectar com o servidor'
      })
      toast.error('Erro ao importar arquivo')
    } finally {
      setIsImporting(false)
      // Limpar input para permitir reimportar o mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // Dados padrão se não houver dados - com validação de números seguros
  const overview = {
    totalBalance: safeNumber(data?.overview?.totalBalance),
    monthlyIncome: safeNumber(data?.overview?.monthlyIncome),
    monthlyExpense: safeNumber(data?.overview?.monthlyExpense),
    monthlyBalance: safeNumber(data?.overview?.monthlyBalance),
    incomeChange: safeNumber(data?.overview?.incomeChange),
    expenseChange: safeNumber(data?.overview?.expenseChange)
  }

  const monthlyData = (data?.monthlyData || []).map(m => ({
    month: m.month,
    income: safeNumber(m.income),
    expense: safeNumber(m.expense)
  }))
  const categoryExpenses = (data?.categoryExpenses || []).map(c => ({
    ...c,
    amount: safeNumber(c.amount)
  }))
  const recentTransactions = data?.recentTransactions || []
  const goals = (data?.goals || []).map(g => ({
    ...g,
    targetAmount: safeNumber(g.targetAmount),
    currentAmount: safeNumber(g.currentAmount),
    progress: safeNumber(g.progress),
    remaining: safeNumber(g.remaining)
  }))
  const monScore = data?.monScore || { score: 0, totalPoints: 0, level: 1, levelName: "Iniciante", earnedBadgesCount: 0 }

  const categoryData = categoryExpenses.map(cat => ({
    name: cat.categoryName,
    value: safeNumber(cat.amount),
    color: cat.categoryColor || COLORS[0]
  }))

  const kpiCards = [
    {
      title: "Saldo Total",
      value: overview.totalBalance,
      change: overview.incomeChange,
      icon: <Wallet className="h-4 w-4 md:h-5 md:w-5" />,
      color: "amber",
    },
    {
      title: "Receitas",
      value: overview.monthlyIncome,
      change: overview.incomeChange,
      icon: <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />,
      color: "emerald",
    },
    {
      title: "Despesas",
      value: overview.monthlyExpense,
      change: overview.expenseChange,
      icon: <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5" />,
      color: "rose",
    },
    {
      title: "Fluxo de Caixa",
      value: overview.monthlyBalance,
      change: overview.incomeChange,
      icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />,
      color: "yellow",
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold"
          >
            Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Bem-vindo{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Aqui está seu resumo financeiro.
          </motion.p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setCurrentView("reports")}>
            Ver Relatórios
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            onClick={() => setCurrentView("transactions")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Import Excel Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <FileSpreadsheet className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-base md:text-lg font-semibold">Importar Planilha Excel</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Excel (.xlsx, .xls), CSV ou OFX
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-2">
                {/* Input file oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".xlsx,.xls,.csv,.ofx"
                  className="hidden"
                />
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 hover:bg-amber-500/10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Selecionar Arquivo</span>
                      <span className="sm:hidden">Importar</span>
                    </>
                  )}
                </Button>
                {/* Resultado da importação */}
                {importResult && (
                  <div className={`flex items-center gap-1 text-xs ${importResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {importResult.success ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{importResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-${kpi.color}-500 to-${kpi.color}-600`} />
              <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate pr-2">
                  {kpi.title}
                </CardTitle>
                <div className={`p-1.5 md:p-2 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 text-${kpi.color}-600 dark:text-${kpi.color}-400 flex-shrink-0`}>
                  {kpi.icon}
                </div>
              </CardHeader>
              <CardContent className="pb-3 md:pb-4 px-3 md:px-4">
                <div className="text-lg md:text-2xl font-bold truncate">
                  {kpi.value >= 0 ? "" : "-"}
                  {formatCurrency(Math.abs(kpi.value))}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-rose-500" />
                  )}
                  <span className={`text-[10px] md:text-xs ${kpi.change >= 0 ? "text-amber-500" : "text-rose-500"}`}>
                    {kpi.change >= 0 ? "+" : ""}{kpi.change.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Cash Flow Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Fluxo de Caixa</CardTitle>
              <CardDescription className="text-xs md:text-sm">Receitas vs Despesas nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              {monthlyData.length === 0 ? (
                <div className="h-[200px] md:h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Sem dados suficientes para o gráfico</p>
                </div>
              ) : (
                <div className="h-[200px] md:h-[300px]">
                  {/* Gráfico de Pizza - Fluxo Financeiro */}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Receitas", value: overview.monthlyIncome, color: "#22c55e" },
                          { name: "Despesas", value: overview.monthlyExpense, color: "#f43f5e" },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#f43f5e" />
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Resumo abaixo do gráfico */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Receitas</span>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(overview.monthlyIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                        <span className="text-sm text-rose-600">Despesas</span>
                      </div>
                      <span className="font-bold text-rose-600">{formatCurrency(overview.monthlyExpense)}</span>
                    </div>
                  </div>
                  
                  {/* Saldo do mês */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mt-2">
                    <span className="text-sm text-muted-foreground">Saldo do Mês</span>
                    <span className={`font-bold ${overview.monthlyBalance >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                      {overview.monthlyBalance >= 0 ? '+' : ''}{formatCurrency(overview.monthlyBalance)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Gastos por Categoria</CardTitle>
              <CardDescription className="text-xs md:text-sm">Distribuição mensal</CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              {categoryData.length === 0 ? (
                <div className="h-[150px] md:h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Sem despesas este mês</p>
                </div>
              ) : (
                <>
                  <div className="h-[150px] md:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {categoryData.slice(0, 4).map((cat, index) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium flex-shrink-0">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
              <div>
                <CardTitle className="text-base md:text-lg">Transações Recentes</CardTitle>
                <CardDescription className="text-xs md:text-sm">Últimas movimentações</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs hidden sm:flex" onClick={() => setCurrentView("transactions")}>
                Ver todas
              </Button>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma transação encontrada</p>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-yellow-600"
                    onClick={() => setCurrentView("transactions")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Transação
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                          transaction.type === "INCOME" 
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" 
                            : "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                        }`}>
                          {transaction.type === "INCOME" ? (
                            <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {transaction.category?.name || "Sem categoria"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <p className={`font-semibold text-sm md:text-base ${
                          transaction.type === "INCOME" ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {transaction.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
              <div>
                <CardTitle className="text-base md:text-lg">Metas Financeiras</CardTitle>
                <CardDescription className="text-xs md:text-sm">Acompanhe seu progresso</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs hidden sm:flex" onClick={() => setCurrentView("goals")}>
                Ver todas
              </Button>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              {goals.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma meta cadastrada</p>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-yellow-600"
                    onClick={() => setCurrentView("goals")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Meta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {goals.slice(0, 3).map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs md:text-sm font-medium truncate">{goal.name}</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
                          {Math.round(goal.progress)}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5 md:h-2" />
                      <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mone Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-950 to-slate-950 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              {/* Score Circle */}
              <div className="relative flex-shrink-0">
                <svg className="transform -rotate-90" width={120} height={120}>
                  <circle 
                    cx={60} 
                    cy={60} 
                    r={52} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={8} 
                    className="text-muted/30" 
                  />
                  <motion.circle
                    cx={60} 
                    cy={60} 
                    r={52} 
                    fill="none" 
                    stroke="url(#moneScoreGradient)" 
                    strokeWidth={8}
                    strokeLinecap="round" 
                    initial={{ strokeDashoffset: 327 }} 
                    animate={{ strokeDashoffset: 327 - ((monScore?.score || 0) / 1000) * 327 }}
                    transition={{ duration: 1.5, ease: "easeOut" }} 
                    style={{ strokeDasharray: 327 }}
                  />
                  <defs>
                    <linearGradient id="moneScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    {monScore?.score || 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground">de 1.000</span>
                </div>
              </div>

              {/* Score Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg md:text-xl font-bold text-white">Mone Score</h3>
                </div>
                <p className="text-xs md:text-sm text-amber-100/70 mb-3">
                  Sua pontuação financeira gamificada
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Award className="h-3 w-3 mr-1" />
                    {monScore?.levelName || 'Iniciante'}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-300">
                    <Star className="h-3 w-3 mr-1" />
                    {monScore?.totalPoints || 0} pts totais
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300">
                    {monScore?.earnedBadgesCount || 0} conquistas
                  </Badge>
                </div>
              </div>

              {/* Badges Preview */}
              <div className="flex-shrink-0">
                <p className="text-[10px] text-muted-foreground text-center mb-2">Insígnias</p>
                <div className="flex -space-x-2">
                  {[
                    { icon: <Target className="h-3 w-3" />, color: "bg-emerald-500/20 text-emerald-400" },
                    { icon: <PiggyBank className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-400" },
                    { icon: <Flame className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-400" },
                    { icon: <Zap className="h-3 w-3" />, color: "bg-yellow-500/20 text-yellow-400" },
                  ].map((badge, i) => (
                    <div 
                      key={i}
                      className={`w-8 h-8 rounded-full ${badge.color} flex items-center justify-center border-2 border-slate-900`}
                    >
                      {badge.icon}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs"
                  onClick={() => setCurrentView("monscore")}
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
