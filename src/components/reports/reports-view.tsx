"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
} from "recharts"

const monthlyData = [
  { month: "Jan", income: 8500, expense: 6200, savings: 2300 },
  { month: "Fev", income: 9200, expense: 5800, savings: 3400 },
  { month: "Mar", income: 8800, expense: 7100, savings: 1700 },
  { month: "Abr", income: 10500, expense: 6500, savings: 4000 },
  { month: "Mai", income: 9800, expense: 7200, savings: 2600 },
  { month: "Jun", income: 11200, expense: 6800, savings: 4400 },
]

const categoryData = [
  { name: "Alimentação", value: 2800, color: "#10b981" },
  { name: "Moradia", value: 2500, color: "#3b82f6" },
  { name: "Transporte", value: 1500, color: "#f97316" },
  { name: "Lazer", value: 900, color: "#8b5cf6" },
  { name: "Saúde", value: 650, color: "#ec4899" },
  { name: "Outros", value: 450, color: "#06b6d4" },
]

const aiInsights = [
  {
    type: "warning",
    icon: AlertCircle,
    title: "Gasto elevado em Alimentação",
    description: "Você gastou 15% acima da média em restaurantes este mês. Considere cozinhar mais em casa.",
    color: "amber"
  },
  {
    type: "success",
    icon: CheckCircle,
    title: "Meta de Economia Atingida",
    description: "Parabéns! Você economizou R$ 4.400 este mês, superando sua meta em 22%.",
    color: "emerald"
  },
  {
    type: "tip",
    icon: Lightbulb,
    title: "Oportunidade de Investimento",
    description: "Com base no seu fluxo de caixa, você pode aumentar sua aplicação mensal em R$ 500.",
    color: "blue"
  },
  {
    type: "alert",
    icon: TrendingDown,
    title: "Assinaturas Recorrentes",
    description: "Você tem 5 assinaturas totalizando R$ 289/mês. Revise se todas são necessárias.",
    color: "rose"
  }
]

const chatMessages = [
  { role: "assistant", content: "Olá! Sou sua assistente financeira com IA. Como posso ajudar você hoje? Posso analisar seus gastos, sugerir economias ou responder dúvidas sobre suas finanças." },
]

export function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState(chatMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    const newMessage = { role: "user" as const, content: chatInput }
    setMessages([...messages, newMessage])
    setChatInput("")
    setIsLoading(true)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "assistant" as const,
        content: "Analisando suas finanças... Com base nos seus dados, identifiquei que você pode economizar cerca de R$ 800 por mês reduzindo gastos com delivery e assinaturas não utilizadas. Deseja que eu crie um plano de ação detalhado?"
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 3000)
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
            Insights inteligentes sobre suas finanças
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
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Relatório IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Visão Geral Financeira
                </CardTitle>
                <CardDescription>Análise de receitas, despesas e economia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
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
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Insights Inteligentes
                </CardTitle>
                <CardDescription>Análises geradas por IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`p-4 rounded-lg border-l-4 border-${insight.color}-500 bg-${insight.color}-50 dark:bg-${insight.color}-950/20`}
                    >
                      <div className="flex items-start gap-3">
                        <insight.icon className={`h-5 w-5 text-${insight.color}-500 flex-shrink-0 mt-0.5`} />
                        <div>
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
          <Card className="border-0 shadow-lg h-[700px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Chat com IA
              </CardTitle>
              <CardDescription>Pergunte sobre suas finanças</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      }`}
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
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
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
