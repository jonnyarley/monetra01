"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, cn } from "@/lib/utils"
import { toast } from "sonner"

// Helper function to ensure valid numbers for charts (prevents NaN/Infinity SVG errors)
const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  if (!Number.isFinite(num) || isNaN(num)) return defaultValue
  return num
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]

interface DayData {
  income: number
  expense: number
  transactions: Array<{
    id: string
    description: string
    amount: number
    type: string
    category: string
    categoryColor: string | null
  }>
}

interface CalendarDataResponse {
  calendarData: Record<string, DayData>
  monthlyTotals: Array<{
    month: number
    monthName: string
    income: number
    expense: number
    balance: number
  }>
  yearlyTotals: {
    income: number
    expense: number
    balance: number
  }
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

export function CalendarView() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"year" | "month" | "week">("year")
  const [data, setData] = useState<CalendarDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/calendar?year=${currentYear}`)
      if (!response.ok) throw new Error("Erro ao carregar dados")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching calendar:", error)
      toast.error("Erro ao carregar dados do calendário")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentYear])

  // Garantir que sempre tenhamos valores válidos e números seguros para gráficos
  const calendarData = data?.calendarData || {}
  const monthlyTotals = (data?.monthlyTotals || []).map(m => ({
    ...m,
    income: safeNumber(m.income),
    expense: safeNumber(m.expense),
    balance: safeNumber(m.balance)
  }))
  const yearlyTotals = {
    income: safeNumber(data?.yearlyTotals?.income),
    expense: safeNumber(data?.yearlyTotals?.expense),
    balance: safeNumber(data?.yearlyTotals?.balance)
  }

  // Get week data for selected month
  const getWeekData = (monthIndex: number) => {
    const weeks: Array<{ week: number; income: number; expense: number }> = []
    const daysInMonth = getDaysInMonth(currentYear, monthIndex)
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex)
    
    let currentWeek = 1
    let weekIncome = 0
    let weekExpense = 0
    let dayCount = 0
    
    for (let i = 0; i < firstDay; i++) {
      dayCount++
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayData = calendarData[dateKey]
      
      if (dayData) {
        weekIncome += safeNumber(dayData.income)
        weekExpense += safeNumber(dayData.expense)
      }
      
      dayCount++
      
      if (dayCount === 7 || day === daysInMonth) {
        weeks.push({
          week: currentWeek,
          income: safeNumber(weekIncome),
          expense: safeNumber(weekExpense)
        })
        currentWeek++
        weekIncome = 0
        weekExpense = 0
        dayCount = 0
      }
    }
    
    return weeks
  }

  const getDayIntensity = (income: number, expense: number) => {
    const total = (income || 0) + (expense || 0)
    const maxAmount = 5000
    const intensity = Math.min(total / maxAmount, 1)
    
    if (total === 0) return "bg-transparent"
    
    const hasMoreExpense = (expense || 0) > (income || 0)
    
    if (hasMoreExpense) {
      if (intensity > 0.7) return "bg-rose-500 text-white"
      if (intensity > 0.4) return "bg-rose-400 text-white"
      return "bg-rose-200 dark:bg-rose-900/50"
    } else {
      if (intensity > 0.7) return "bg-emerald-500 text-white"
      if (intensity > 0.4) return "bg-emerald-400 text-white"
      return "bg-emerald-200 dark:bg-emerald-900/50"
    }
  }

  const selectedDayData = selectedDay ? calendarData[selectedDay] : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold flex items-center gap-2"
          >
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
            Calendário
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Visualize seus gastos por dia, semana e mês
          </motion.p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentYear(currentYear - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg md:text-xl font-bold min-w-[80px] text-center">{currentYear}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentYear(currentYear + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - Totais do Ano */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Entradas</p>
                  <p className="text-lg md:text-2xl font-bold text-emerald-600 truncate">
                    {formatCurrency(yearlyTotals.income)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500/10 to-red-500/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                  <ArrowDownRight className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Saídas</p>
                  <p className="text-lg md:text-2xl font-bold text-rose-600 truncate">
                    {formatCurrency(yearlyTotals.expense)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Saldo Anual</p>
                  <p className={`text-lg md:text-2xl font-bold truncate ${yearlyTotals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(yearlyTotals.balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "year" | "month" | "week")} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-sm grid-cols-3 h-9">
          <TabsTrigger value="year" className="text-xs md:text-sm">Anual</TabsTrigger>
          <TabsTrigger value="month" className="text-xs md:text-sm">Mês</TabsTrigger>
          <TabsTrigger value="week" className="text-xs md:text-sm">Semana</TabsTrigger>
        </TabsList>

        {/* Year View */}
        <TabsContent value="year">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {MONTHS_FULL.map((monthName, monthIndex) => {
              const monthData = monthlyTotals.find(m => m.month === monthIndex) || { income: 0, expense: 0, balance: 0 }
              const daysInMonth = getDaysInMonth(currentYear, monthIndex)
              const firstDay = getFirstDayOfMonth(currentYear, monthIndex)
              
              return (
                <motion.div
                  key={monthName}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: monthIndex * 0.02 }}
                >
                  <Card 
                    className="border-0 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group"
                    onClick={() => {
                      setSelectedMonth(monthIndex)
                      setViewMode("month")
                    }}
                  >
                    <CardHeader className="pb-1 p-2 md:p-4">
                      <CardTitle className="text-sm md:text-base">{MONTHS[monthIndex]}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 md:p-4 pt-0">
                      {/* Mini Calendar Grid */}
                      <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-[10px] md:text-xs">
                        {DAYS.map(day => (
                          <div key={day} className="text-center text-muted-foreground font-medium py-0.5">
                            {day}
                          </div>
                        ))}
                        
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        
                        {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                          const day = dayIndex + 1
                          const dateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                          const dayData = calendarData[dateKey]
                          
                          return (
                            <div
                              key={day}
                              className={cn(
                                "aspect-square flex items-center justify-center rounded text-[10px] md:text-xs font-medium transition-all",
                                getDayIntensity(dayData?.income || 0, dayData?.expense || 0)
                              )}
                            >
                              {day}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Month Summary - APENAS Total de Entradas e Saídas */}
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between items-center text-[10px] md:text-xs">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
                            <span className="text-emerald-600 font-semibold">
                              {formatCurrency(monthData.income || 0).replace("R$", "").trim()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowDownRight className="h-2.5 w-2.5 text-rose-500 flex-shrink-0" />
                            <span className="text-rose-600 font-semibold">
                              {formatCurrency(monthData.expense || 0).replace("R$", "").trim()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month">
          {selectedMonth !== null ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Month Navigation */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11)
                        setCurrentYear(currentYear - 1)
                      } else {
                        setSelectedMonth(selectedMonth - 1)
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <h2 className="text-base md:text-xl font-bold text-center">
                    {MONTHS[selectedMonth]} {currentYear}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0)
                        setCurrentYear(currentYear + 1)
                      } else {
                        setSelectedMonth(selectedMonth + 1)
                      }
                    }}
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewMode("year")} className="self-start">
                  ← Voltar ao Ano
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Large Calendar */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-3 md:p-6">
                      {/* Days Header */}
                      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
                        {DAYS.map(day => (
                          <div key={day} className="text-center font-semibold text-muted-foreground text-xs md:text-sm">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {Array.from({ length: getFirstDayOfMonth(currentYear, selectedMonth) }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        
                        {Array.from({ length: getDaysInMonth(currentYear, selectedMonth) }).map((_, dayIndex) => {
                          const day = dayIndex + 1
                          const dateKey = `${currentYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                          const dayData = calendarData[dateKey]
                          const isSelected = selectedDay === dateKey
                          
                          return (
                            <motion.button
                              key={day}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative",
                                getDayIntensity(dayData?.income || 0, dayData?.expense || 0),
                                isSelected && "ring-2 ring-emerald-500 ring-offset-2",
                                dayData?.transactions?.length && "cursor-pointer hover:shadow-lg"
                              )}
                              onClick={() => setSelectedDay(dateKey)}
                            >
                              <span className="font-semibold text-xs md:text-sm">{day}</span>
                              {dayData?.transactions?.length ? (
                                <span className="text-[8px] md:text-[10px] opacity-75 hidden sm:block">
                                  {dayData.transactions.length}
                                </span>
                              ) : null}
                            </motion.button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Details */}
                <div>
                  <Card className="border-0 shadow-lg h-full">
                    <CardHeader className="p-3 md:p-4">
                      <CardTitle className="text-sm md:text-base">
                        {selectedDay 
                          ? new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { 
                              weekday: "short", 
                              day: "numeric", 
                              month: "short" 
                            })
                          : "Selecione um dia"
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                      {selectedDayData ? (
                        <div className="space-y-3 md:space-y-4">
                          {/* Day Summary */}
                          <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div className="p-2 md:p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                              <p className="text-[10px] md:text-xs text-muted-foreground">Receitas</p>
                              <p className="text-sm md:text-lg font-bold text-emerald-600 truncate">
                                {formatCurrency(selectedDayData.income || 0)}
                              </p>
                            </div>
                            <div className="p-2 md:p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                              <p className="text-[10px] md:text-xs text-muted-foreground">Despesas</p>
                              <p className="text-sm md:text-lg font-bold text-rose-600 truncate">
                                {formatCurrency(selectedDayData.expense || 0)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Transactions List */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-xs md:text-sm">Transações</h4>
                            <ScrollArea className="h-[200px] md:h-[250px]">
                              {(selectedDayData.transactions || []).map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={cn(
                                      "p-1 md:p-1.5 rounded flex-shrink-0",
                                      t.type === "INCOME" 
                                        ? "bg-emerald-100 dark:bg-emerald-900/30" 
                                        : "bg-rose-100 dark:bg-rose-900/30"
                                    )}>
                                      {t.type === "INCOME" 
                                        ? <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                                        : <ArrowDownRight className="h-3 w-3 text-rose-600" />
                                      }
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs md:text-sm font-medium truncate">{t.description}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{t.category}</p>
                                    </div>
                                  </div>
                                  <span className={cn(
                                    "font-semibold text-xs md:text-sm flex-shrink-0",
                                    t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                                  )}>
                                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                                  </span>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4 md:py-8">
                          <CalendarIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-xs md:text-sm">Nenhuma transação neste dia</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 md:py-12 text-center">
                <CalendarIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm md:text-base">Selecione um mês para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          {selectedMonth !== null ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Month Selector */}
              <div className="flex items-center gap-3">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex h-9 w-[140px] md:w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {MONTHS_FULL.map((month, index) => (
                    <option key={month} value={index}>
                      {month} {currentYear}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => setViewMode("year")}>
                  Voltar ao Ano
                </Button>
              </div>

              {/* Weeks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {getWeekData(selectedMonth).map((week) => (
                  <Card key={week.week} className="border-0 shadow-lg overflow-hidden">
                    <div className={cn(
                      "h-1.5 md:h-2",
                      week.expense > week.income ? "bg-rose-500" : "bg-emerald-500"
                    )} />
                    <CardHeader className="pb-1 p-3 md:p-4">
                      <CardTitle className="text-sm md:text-base">Semana {week.week}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
                            <span className="text-muted-foreground text-[10px] md:text-xs">Receitas</span>
                          </div>
                          <span className="font-semibold text-emerald-600 text-xs md:text-sm">
                            {formatCurrency(week.income)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-rose-500" />
                            <span className="text-muted-foreground text-[10px] md:text-xs">Despesas</span>
                          </div>
                          <span className="font-semibold text-rose-600 text-xs md:text-sm">
                            {formatCurrency(week.expense)}
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center text-xs md:text-sm">
                            <span className="font-medium">Balanço</span>
                            <span className={cn(
                              "font-bold",
                              week.income - week.expense >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {formatCurrency(week.income - week.expense)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Weekly Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base">Comparativo Semanal</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <div className="h-[200px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getWeekData(selectedMonth)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tickFormatter={(v) => `S${v}`} className="text-[10px] md:text-xs" />
                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-[10px] md:text-xs" width={30} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 md:py-12 text-center">
                <CalendarIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm md:text-base">Selecione um mês na visão mensal para ver as semanas</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth())
                  }}
                >
                  Selecionar Mês Atual
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Year Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">Tendência Anual</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {monthlyTotals.length === 0 ? (
              <div className="h-[200px] md:h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados suficientes para o gráfico</p>
              </div>
            ) : (
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTotals}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthName" tickFormatter={(v) => v?.substring(0, 3) || ''} className="text-[10px] md:text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-[10px] md:text-xs" width={35} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      name="Receitas" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      name="Despesas" 
                      stroke="#f43f5e" 
                      strokeWidth={2}
                      dot={{ fill: "#f43f5e", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <Card className="border-0 shadow-lg">
        <CardContent className="py-3 md:py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-[10px] md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Receitas &gt; Despesas</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-rose-500" />
              <span className="text-muted-foreground">Despesas &gt; Receitas</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-emerald-200 dark:bg-emerald-900/50" />
              <span className="text-muted-foreground">Baixo volume</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Alto volume</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
