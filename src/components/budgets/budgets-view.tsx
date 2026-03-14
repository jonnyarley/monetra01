"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, calculatePercentage, cn } from "@/lib/utils"
import { toast } from "sonner"

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  percentage: number
  remaining: number
  isOverBudget: boolean
  isNearLimit: boolean
  category: {
    id: string
    name: string
    color: string | null
  } | null
}

interface Category {
  id: string
  name: string
  type: string
  color: string | null
}

export function BudgetsView() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newBudget, setNewBudget] = useState({
    name: "",
    categoryId: "",
    amount: "",
    alertThreshold: "80",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [budgetRes, catRes] = await Promise.all([
        fetch("/api/budgets/"),
        fetch("/api/categories/")
      ])

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        setBudgets(budgetData.budgets || [])
      }

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories?.filter((c: Category) => c.type === "EXPENSE") || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.amount) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      const now = new Date()
      const response = await fetch("/api/budgets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBudget.name,
          categoryId: newBudget.categoryId || null,
          amount: parseFloat(newBudget.amount),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          alertThreshold: parseInt(newBudget.alertThreshold) || 80,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar orçamento")
      }

      toast.success("Orçamento criado com sucesso!")
      setIsAddBudgetOpen(false)
      setNewBudget({ name: "", categoryId: "", amount: "", alertThreshold: "80" })
      fetchData()
    } catch (error) {
      console.error("Error creating budget:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar orçamento")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    try {
      const response = await fetch(`/api/budgets/?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erro ao excluir orçamento")
      toast.success("Orçamento excluído!")
      fetchData()
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast.error("Erro ao excluir orçamento")
    }
  }

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
  const overBudgetCount = budgets.filter(b => b.isOverBudget).length
  const healthyCount = budgets.filter(b => !b.isNearLimit && !b.isOverBudget).length

  const getBudgetStatus = (budget: Budget) => {
    if (budget.isOverBudget) return { status: "exceeded", color: "rose", icon: AlertTriangle }
    if (budget.isNearLimit) return { status: "warning", color: "amber", icon: AlertTriangle }
    return { status: "healthy", color: "emerald", icon: CheckCircle }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando orçamentos...</p>
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
            className="text-2xl md:text-3xl font-bold"
          >
            Orçamentos
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Defina limites de gastos por categoria
          </motion.p>
        </div>
        <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
              <DialogDescription>Defina um limite de gastos</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Alimentação Mensal"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={newBudget.categoryId} onValueChange={(v) => setNewBudget({ ...newBudget, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor Limite *</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Alerta em (%)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={newBudget.alertThreshold}
                    onChange={(e) => setNewBudget({ ...newBudget, alertThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddBudgetOpen(false)}>Cancelar</Button>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600" 
                  onClick={handleCreateBudget}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Orçamento Total", value: formatCurrency(totalBudget), icon: PiggyBank, color: "amber" },
          { label: "Gasto Atual", value: formatCurrency(totalSpent), icon: TrendingDown, color: "blue" },
          { label: "Acima do Limite", value: overBudgetCount, icon: AlertTriangle, color: "rose", isCount: true },
          { label: "Saúde Financeira", value: healthyCount, icon: CheckCircle, color: "emerald", isCount: true },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`h-4 w-4 md:h-5 md:w-5 text-${stat.color}-600`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-base md:text-xl font-bold truncate ${stat.isCount && stat.color === "rose" ? "text-rose-600" : stat.isCount && stat.color === "emerald" ? "text-emerald-600" : ""}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Budgets List */}
      {budgets.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum orçamento cadastrado</p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-yellow-600"
              onClick={() => setIsAddBudgetOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {budgets.map((budget, index) => {
            const { status, color, icon: StatusIcon } = getBudgetStatus(budget)
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <Card className={cn(
                  "border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow",
                  status === "exceeded" && "ring-2 ring-rose-500/20"
                )}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div 
                          className="p-1.5 md:p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${budget.category?.color || "#f59e0b"}20` }}
                        >
                          <PiggyBank className="h-4 w-4 md:h-5 md:w-5" style={{ color: budget.category?.color || "#f59e0b" }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm md:text-base truncate">{budget.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px]",
                              status === "exceeded" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                              status === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              status === "healthy" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status === "exceeded" ? "Estourado" : status === "warning" ? "Atenção" : "Saudável"}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteBudget(budget.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Gasto</span>
                        <span className="font-medium">{Math.round(budget.percentage)}% do limite</span>
                      </div>
                      <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className={cn(
                          "h-1.5 md:h-2",
                          status === "exceeded" && "[&>div]:bg-rose-500",
                          status === "warning" && "[&>div]:bg-amber-500",
                          status === "healthy" && "[&>div]:bg-emerald-500"
                        )}
                      />
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">Gasto</p>
                          <p className={cn(
                            "text-sm md:text-lg font-bold",
                            status === "exceeded" && "text-rose-600"
                          )}>
                            {formatCurrency(budget.spent)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            {budget.remaining >= 0 ? "Disponível" : "Excedido"}
                          </p>
                          <p className={cn(
                            "text-sm md:text-lg font-bold",
                            budget.remaining >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {formatCurrency(Math.abs(budget.remaining))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
