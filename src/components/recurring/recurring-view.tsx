"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
  MoreVertical,
  X,
  Loader2,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string | null
}

interface RecurringTransaction {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  description: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  dayOfMonth: number
  startDate: string
  endDate: string | null
  nextDueDate: string
  isActive: boolean
  autoCreate: boolean
  notifyBefore: number
  category?: Category
}

const frequencyLabels = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual"
}

export function RecurringView() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    description: "",
    categoryId: "",
    frequency: "MONTHLY" as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    dayOfMonth: "1",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    autoCreate: true,
    notifyBefore: "3"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [recurringRes, categoriesRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/categories")
      ])
      
      if (recurringRes.ok) {
        const recurringData = await recurringRes.json()
        setRecurringTransactions(recurringData)
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (transaction?: RecurringTransaction) => {
    if (transaction) {
      setEditingId(transaction.id)
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        categoryId: transaction.category?.id || "",
        frequency: transaction.frequency,
        dayOfMonth: transaction.dayOfMonth.toString(),
        startDate: transaction.startDate.split('T')[0],
        endDate: transaction.endDate ? transaction.endDate.split('T')[0] : "",
        autoCreate: transaction.autoCreate,
        notifyBefore: transaction.notifyBefore.toString()
      })
    } else {
      setEditingId(null)
      setFormData({ type: "EXPENSE", amount: "", description: "", categoryId: "", frequency: "MONTHLY", dayOfMonth: "1", startDate: new Date().toISOString().split('T')[0], endDate: "", autoCreate: true, notifyBefore: "3" })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null) }

  const handleSave = async () => {
    if (!formData.amount || !formData.description) {
      toast.error("Preencha valor e descrição")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
        notifyBefore: parseInt(formData.notifyBefore),
        categoryId: formData.categoryId || null,
        endDate: formData.endDate || null
      }

      if (editingId) {
        const response = await fetch("/api/recurring", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload, isActive: true })
        })
        
        if (!response.ok) throw new Error("Erro ao atualizar")
        
        const updated = await response.json()
        setRecurringTransactions(prev => prev.map(t => t.id === editingId ? updated : t))
        toast.success("Transação atualizada!")
      } else {
        const response = await fetch("/api/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) throw new Error("Erro ao criar")
        
        const created = await response.json()
        setRecurringTransactions(prev => [...prev, created])
        toast.success("Transação criada!")
      }
      handleCloseModal()
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Erro ao salvar transação")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const transaction = recurringTransactions.find(t => t.id === id)
      if (!transaction) return

      const response = await fetch("/api/recurring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          categoryId: transaction.category?.id || null,
          frequency: transaction.frequency,
          dayOfMonth: transaction.dayOfMonth,
          startDate: transaction.startDate,
          endDate: transaction.endDate,
          isActive: !currentValue,
          autoCreate: transaction.autoCreate,
          notifyBefore: transaction.notifyBefore
        })
      })

      if (!response.ok) throw new Error("Erro ao atualizar")

      setRecurringTransactions(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentValue } : t))
      toast.success("Status atualizado!")
    } catch (error) {
      console.error("Error toggling:", error)
      toast.error("Erro ao atualizar status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação recorrente?")) return

    try {
      const response = await fetch(`/api/recurring?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Erro ao excluir")

      setRecurringTransactions(prev => prev.filter(t => t.id !== id))
      toast.success("Transação removida!")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Erro ao excluir transação")
    }
  }

  const totalIncome = recurringTransactions.filter(t => t.type === "INCOME" && t.isActive).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = recurringTransactions.filter(t => t.type === "EXPENSE" && t.isActive).reduce((sum, t) => sum + t.amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando transações recorrentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-amber-500" />
            Transações Recorrentes
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
            Gerencie suas contas fixas e receitas mensais
          </motion.p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Mensais</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Mensais</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                  <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>{recurringTransactions.length} cadastradas • {recurringTransactions.filter(t => t.isActive).length} ativas</CardDescription>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação recorrente cadastrada</p>
              <Button onClick={() => handleOpenModal()} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Transação
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recurringTransactions.map((transaction, index) => (
                <motion.div key={transaction.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${transaction.isActive ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === "INCOME" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {transaction.type === "INCOME" ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{frequencyLabels[transaction.frequency]}</Badge>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Dia {transaction.dayOfMonth}</span>
                        {transaction.category && <Badge variant="secondary" className="text-xs" style={transaction.category.color ? { backgroundColor: transaction.category.color + '20', color: transaction.category.color } : {}}>{transaction.category.name}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${transaction.type === "INCOME" ? "text-emerald-600" : "text-red-600"}`}>
                        {transaction.type === "INCOME" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {transaction.autoCreate && <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />Auto</Badge>}
                        {transaction.notifyBefore > 0 && <Badge variant="outline" className="text-xs"><Bell className="h-3 w-3 mr-1" />{transaction.notifyBefore}d</Badge>}
                      </div>
                    </div>
                    <Switch checked={transaction.isActive} onCheckedChange={() => handleToggleActive(transaction.id, transaction.isActive)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenModal(transaction)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(transaction.id)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-background rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingId ? "Editar" : "Nova"} Transação Recorrente</h2>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "INCOME" | "EXPENSE" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Receita</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Ex: Aluguel, Netflix, Salário..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Diário</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="YEARLY">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dia do Mês</Label>
                    <Input type="number" min="1" max="31" placeholder="1-31" value={formData.dayOfMonth} onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Término (opcional)</Label>
                    <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Criar automaticamente</Label>
                    <p className="text-xs text-muted-foreground">Lança a transação no dia automaticamente</p>
                  </div>
                  <Switch checked={formData.autoCreate} onCheckedChange={(v) => setFormData({ ...formData, autoCreate: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificar antes</Label>
                    <p className="text-xs text-muted-foreground">Dias antes do vencimento</p>
                  </div>
                  <Input type="number" min="0" max="30" className="w-20" value={formData.notifyBefore} onChange={(e) => setFormData({ ...formData, notifyBefore: e.target.value })} />
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
