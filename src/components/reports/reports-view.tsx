"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Sparkles,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  Info,
  AlertTriangle,
  Wallet,
  Target,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface ReportData {
  summary: {
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    savings: number
    savingsRate: number
    transactionCount: number
  }
  comparison: {
    incomeChange: number
    expenseChange: number
  }
  categories: { name: string; amount: number; count: number }[]
  monthlyTrend: { month: string; income: number; expense: number }[]
  alerts: { type: string; title: string; description: string }[]
  goals: { id: string; name: string; target: number; current: number; progress: number; status: string }[]
  recurring: { total: number; count: number; items: { id: string; name: string; amount: number; day: number }[] }
  pendingBills: { id: string; name: string; amount: number; dueDate: string; daysUntil: number }[]
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Olá! Sou sua assistente de relatórios financeiros. Posso analisar seus dados e responder perguntas sobre suas finanças. O que você gostaria de saber?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch(`/api/reports-ai?period=${selectedPeriod}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        // Adicionar mensagem de boas-vindas se primeira vez
        if (messages.length === 1) {
          setMessages([
            { role: "assistant", content: `📊 **Relatório carregado com sucesso!**

**Resumo Rápido:**
• Saldo: R$ ${result.data.summary.totalBalance.toFixed(2)}
• Receitas: R$ ${result.data.summary.monthlyIncome.toFixed(2)}
• Despesas: R$ ${result.data.summary.monthlyExpenses.toFixed(2)}
• Economia: ${result.data.summary.savingsRate.toFixed(1)}%

${result.data.alerts.length > 0 ? `**Alertas:** ${result.data.alerts.length} alerta(s) pendente(s)` : "✅ Tudo em ordem!"}

Posso ajudá-lo a entender melhor seus dados. O que você gostaria de saber?` }
          ])
        }
      } else {
        setError("Erro ao carregar dados")
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return

    const newMessage = { role: "user", content: chatInput }
    setMessages(prev => [...prev, newMessage])
    setChatInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/reports-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: chatInput })
      })
      
      const result = await response.json()
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: result.response || "Não consegui processar sua pergunta. Tente novamente." 
      }])
    } catch {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Erro ao processar sua pergunta. Tente novamente." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "danger": return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "success": return "border-emerald-500/30 bg-emerald-500/10"
      case "warning": return "border-amber-500/30 bg-amber-500/10"
      case "danger": return "border-red-500/30 bg-red-500/10"
      default: return "border-blue-500/30 bg-blue-500/10"
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro ao carregar relatório</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold flex items-center gap-2"
          >
            <Sparkles className="h-8 w-8 text-amber-500" />
            Relatórios com IA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Análises inteligentes baseadas nos seus dados reais
          </motion.p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={fetchReportData}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </>
            )}
          </Button>
        </div>
      </div>

      {isGenerating && !data ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Analisando seus dados financeiros...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(data?.summary.totalBalance || 0)}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-amber-500/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receitas</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data?.summary.monthlyIncome || 0)}</p>
                      {(data?.comparison.incomeChange || 0) !== 0 && (
                        <p className={cn("text-xs flex items-center gap-1", data?.comparison.incomeChange && data.comparison.incomeChange > 0 ? "text-emerald-500" : "text-red-500")}>
                          {data?.comparison.incomeChange && data.comparison.incomeChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(data?.comparison.incomeChange || 0).toFixed(1)}% vs mês passado
                        </p>
                      )}
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-500/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Despesas</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.summary.monthlyExpenses || 0)}</p>
                      {(data?.comparison.expenseChange || 0) !== 0 && (
                        <p className={cn("text-xs flex items-center gap-1", data?.comparison.expenseChange && data.comparison.expenseChange < 0 ? "text-emerald-500" : "text-red-500")}>
                          {data?.comparison.expenseChange && data.comparison.expenseChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {Math.abs(data?.comparison.expenseChange || 0).toFixed(1)}% vs mês passado
                        </p>
                      )}
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Economia</p>
                      <p className="text-2xl font-bold">{(data?.summary.savingsRate || 0).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">
                        Meta: 20%
                        {(data?.summary.savingsRate || 0) >= 20 && " ✅"}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Overview */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-500" />
                      Evolução Financeira
                    </CardTitle>
                    <CardDescription>Receitas vs Despesas nos últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.monthlyTrend}>
                            <defs>
                              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Sem dados suficientes para o gráfico
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-500" />
                      Gastos por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.categories && data.categories.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={data.categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="amount"
                                nameKey="name"
                              >
                                {data.categories.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: number) => formatCurrency(v)} />
                              <Legend />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {data.categories.slice(0, 6).map((cat, index) => (
                            <div key={cat.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm">{cat.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-medium">{formatCurrency(cat.amount)}</span>
                                <span className="text-xs text-muted-foreground ml-2">({cat.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Sem despesas registradas este mês
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Insights */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Insights Inteligentes
                    </CardTitle>
                    <CardDescription>Análises geradas com base nos seus dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.alerts && data.alerts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.alerts.map((insight, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className={cn("p-4 rounded-lg border-l-4", getAlertColor(insight.type))}
                          >
                            <div className="flex items-start gap-3">
                              {getAlertIcon(insight.type)}
                              <div>
                                <h4 className="font-semibold text-sm">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                        <p>Nenhum alerta no momento. Suas finanças estão em dia!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-1"
            >
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Chat de Análise
                  </CardTitle>
                  <CardDescription>Pergunte sobre suas finanças</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-line",
                            message.role === "user"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-none"
                              : "bg-muted rounded-bl-none"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Pergunte sobre suas finanças..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={isLoading || !chatInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pending Bills */}
          {data?.pendingBills && data.pendingBills.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-500" />
                    Contas a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {data.pendingBills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className={cn(
                        "p-3 rounded-lg border",
                        bill.daysUntil <= 2 ? "border-red-500/50 bg-red-500/10" :
                        bill.daysUntil <= 7 ? "border-amber-500/50 bg-amber-500/10" :
                        "border-border"
                      )}>
                        <p className="font-medium text-sm truncate">{bill.name}</p>
                        <p className="text-lg font-bold">{formatCurrency(bill.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {bill.daysUntil <= 0 ? "Vence hoje!" : `Vence em ${bill.daysUntil} dias`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Export Options */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exportar Relatórios
            </CardTitle>
            <CardDescription>Baixe seus relatórios em diferentes formatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
