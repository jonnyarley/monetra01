"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Target, 
  Calendar,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
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
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, calculatePercentage } from "@/lib/utils"
import { toast } from "sonner"

interface Goal {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  targetDate: Date | null
  category: string | null
  color: string | null
  status: string
  progress: number
  remaining: number
}

const goalColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899"]

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    category: "",
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals/")
      if (!response.ok) throw new Error("Erro ao carregar metas")
      const data = await response.json()
      setGoals(data.goals || [])
    } catch (error) {
      console.error("Error fetching goals:", error)
      toast.error("Erro ao carregar metas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/goals/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGoal.name,
          description: newGoal.description || null,
          targetAmount: parseFloat(newGoal.targetAmount),
          targetDate: newGoal.targetDate || null,
          category: newGoal.category || null,
          color: goalColors[goals.length % goalColors.length],
        }),
      })

      if (!response.ok) throw new Error("Erro ao criar meta")

      toast.success("Meta criada com sucesso!")
      setIsAddGoalOpen(false)
      setNewGoal({ name: "", description: "", targetAmount: "", targetDate: "", category: "" })
      fetchGoals()
    } catch (error) {
      console.error("Error creating goal:", error)
      toast.error("Erro ao criar meta")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/goals/?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erro ao excluir meta")
      toast.success("Meta excluída!")
      fetchGoals()
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast.error("Erro ao excluir meta")
    }
  }

  const handleAddAmount = async (id: string, amount: number) => {
    try {
      const goal = goals.find(g => g.id === id)
      if (!goal) return

      const response = await fetch("/api/goals/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          currentAmount: goal.currentAmount + amount,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar meta")
      toast.success("Valor adicionado!")
      fetchGoals()
    } catch (error) {
      console.error("Error updating goal:", error)
      toast.error("Erro ao atualizar meta")
    }
  }

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)
  const totalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0)
  const completedGoals = goals.filter(g => g.status === "COMPLETED").length
  const activeGoals = goals.filter(g => g.status === "IN_PROGRESS").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando metas...</p>
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
            Metas Financeiras
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Defina e acompanhe seus objetivos financeiros
          </motion.p>
        </div>
        <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Meta Financeira</DialogTitle>
              <DialogDescription>Defina um novo objetivo para alcançar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Meta *</Label>
                <Input
                  placeholder="Ex: Reserva de Emergência"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva sua meta..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor da Meta *</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data Alvo</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: Segurança, Lazer, Educação..."
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>Cancelar</Button>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600" 
                  onClick={handleCreateGoal}
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
          { label: "Metas Ativas", value: activeGoals, icon: Target, color: "amber" },
          { label: "Concluídas", value: completedGoals, icon: CheckCircle, color: "blue" },
          { label: "Total Guardado", value: formatCurrency(totalCurrent), icon: DollarSign, color: "emerald" },
          { label: "Progresso Geral", value: `${calculatePercentage(totalCurrent, totalTarget)}%`, icon: TrendingUp, color: "purple" },
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
                    <p className="text-base md:text-xl font-bold truncate">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma meta cadastrada</p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-yellow-600"
              onClick={() => setIsAddGoalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {goals.map((goal, index) => {
            const daysLeft = goal.targetDate 
              ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null
            const isCompleted = goal.status === "COMPLETED"
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className={`border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow ${isCompleted ? 'opacity-80' : ''}`}>
                  <div className="h-1" style={{ backgroundColor: goal.color || "#10b981" }} />
                  <CardHeader className="pb-2 p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div 
                          className="p-1.5 md:p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${goal.color || "#10b981"}20` }}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" style={{ color: goal.color || "#10b981" }} />
                          ) : (
                            <Target className="h-4 w-4 md:h-5 md:w-5" style={{ color: goal.color || "#10b981" }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm md:text-base truncate">{goal.name}</CardTitle>
                          {goal.category && (
                            <Badge variant="secondary" className="text-[10px] mt-1">
                              {goal.category}
                            </Badge>
                          )}
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
                          <DropdownMenuItem onClick={() => {
                            const amount = prompt("Quanto deseja adicionar?")
                            if (amount && !isNaN(parseFloat(amount))) {
                              handleAddAmount(goal.id, parseFloat(amount))
                            }
                          }}>
                            <DollarSign className="h-4 w-4 mr-2" />Adicionar Valor
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 md:p-4 pt-0">
                    {goal.description && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{Math.round(goal.progress)}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5 md:h-2" />
                      <div className="flex justify-between text-xs md:text-sm">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center justify-between pt-2 border-t gap-2">
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground min-w-0">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {daysLeft !== null 
                              ? daysLeft > 0 
                                ? `${daysLeft} dias restantes` 
                                : 'Prazo vencido'
                              : 'Sem prazo'}
                          </span>
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-amber-600 flex-shrink-0">
                          Faltam {formatCurrency(goal.remaining)}
                        </span>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center justify-center gap-2 pt-2 text-emerald-600">
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium">Meta Concluída!</span>
                      </div>
                    )}
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
