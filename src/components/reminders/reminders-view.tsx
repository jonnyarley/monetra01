"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  X,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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

interface BillReminder {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string | null
  remindDays: number
  isRecurring: boolean
  recurringPeriod: string | null
  isPaid: boolean
  paidAt: string | null
  notes: string | null
}

export function RemindersView() {
  const [reminders, setReminders] = useState<BillReminder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    dueDate: new Date().toISOString().split('T')[0],
    category: "",
    remindDays: "3",
    isRecurring: false,
    recurringPeriod: "",
    notes: ""
  })

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch("/api/reminders")
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error("Error fetching reminders:", error)
      toast.error("Erro ao carregar lembretes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (reminder?: BillReminder) => {
    if (reminder) {
      setEditingId(reminder.id)
      setFormData({
        name: reminder.name,
        amount: reminder.amount.toString(),
        dueDate: reminder.dueDate.split('T')[0],
        category: reminder.category || "",
        remindDays: reminder.remindDays.toString(),
        isRecurring: reminder.isRecurring,
        recurringPeriod: reminder.recurringPeriod || "",
        notes: reminder.notes || ""
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", amount: "", dueDate: new Date().toISOString().split('T')[0], category: "", remindDays: "3", isRecurring: false, recurringPeriod: "", notes: "" })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null) }

  const handleSave = async () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        category: formData.category || null,
        remindDays: parseInt(formData.remindDays),
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.recurringPeriod || null,
        notes: formData.notes || null
      }

      if (editingId) {
        const response = await fetch("/api/reminders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload })
        })
        
        if (!response.ok) throw new Error("Erro ao atualizar")
        
        const updated = await response.json()
        setReminders(prev => prev.map(r => r.id === editingId ? updated : r))
        toast.success("Lembrete atualizado!")
      } else {
        const response = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) throw new Error("Erro ao criar")
        
        const created = await response.json()
        setReminders(prev => [...prev, created])
        toast.success("Lembrete criado!")
      }
      handleCloseModal()
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Erro ao salvar lembrete")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      const reminder = reminders.find(r => r.id === id)
      if (!reminder) return

      const response = await fetch("/api/reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: reminder.name,
          amount: reminder.amount,
          dueDate: reminder.dueDate,
          category: reminder.category,
          remindDays: reminder.remindDays,
          isRecurring: reminder.isRecurring,
          recurringPeriod: reminder.recurringPeriod,
          isPaid: true,
          notes: reminder.notes
        })
      })

      if (!response.ok) throw new Error("Erro ao marcar como pago")

      setReminders(prev => prev.map(r => r.id === id ? { ...r, isPaid: true, paidAt: new Date().toISOString() } : r))
      toast.success("Marcado como pago!")
    } catch (error) {
      console.error("Error marking paid:", error)
      toast.error("Erro ao marcar como pago")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lembrete?")) return

    try {
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Erro ao excluir")

      setReminders(prev => prev.filter(r => r.id !== id))
      toast.success("Lembrete removido!")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Erro ao excluir lembrete")
    }
  }

  const pendingReminders = reminders.filter(r => !r.isPaid)
  const paidReminders = reminders.filter(r => r.isPaid)
  const totalPending = pendingReminders.reduce((sum, r) => sum + r.amount, 0)

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate)
    if (days < 0) return <Badge className="bg-red-500">Vencido</Badge>
    if (days === 0) return <Badge className="bg-amber-500">Vence hoje</Badge>
    if (days <= 3) return <Badge className="bg-orange-500">{days} dias</Badge>
    if (days <= 7) return <Badge className="bg-yellow-500">{days} dias</Badge>
    return <Badge variant="outline">{days} dias</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando lembretes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-500" />
            Lembretes de Contas
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
            Nunca mais esqueça de pagar suas contas
          </motion.p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contas Pendentes</p>
                  <p className="text-2xl font-bold text-emerald-600">{pendingReminders.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Contas Pendentes
          </CardTitle>
          <CardDescription>{pendingReminders.length} contas aguardando pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReminders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Todas as contas estão em dia!</p>
              <Button onClick={() => handleOpenModal()} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lembrete
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((reminder, index) => (
                <motion.div key={reminder.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{reminder.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(reminder.dueDate).toLocaleDateString('pt-BR')}</span>
                        {reminder.category && <Badge variant="secondary" className="text-xs">{reminder.category}</Badge>}
                        {reminder.isRecurring && <Badge variant="outline" className="text-xs">Recorrente</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(reminder.amount)}</p>
                      {getStatusBadge(reminder.dueDate)}
                    </div>
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-500 hover:bg-emerald-50" onClick={() => handleMarkPaid(reminder.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Pago
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenModal(reminder)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(reminder.id)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {paidReminders.length > 0 && (
        <Card className="border-0 shadow-lg opacity-70">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Pagas Recentemente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paidReminders.slice(0, 5).map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium line-through">{reminder.name}</p>
                      <p className="text-xs text-muted-foreground">Pago em {reminder.paidAt ? new Date(reminder.paidAt).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-muted-foreground">{formatCurrency(reminder.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-background rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingId ? "Editar" : "Novo"} Lembrete</h2>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Conta</Label>
                  <Input placeholder="Ex: Cartão Nubank, Luz, Internet..." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Vencimento</Label>
                    <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Contas">Contas</SelectItem>
                        <SelectItem value="Impostos">Impostos</SelectItem>
                        <SelectItem value="Empréstimos">Empréstimos</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lembrar antes</Label>
                    <Select value={formData.remindDays} onValueChange={(v) => setFormData({ ...formData, remindDays: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia antes</SelectItem>
                        <SelectItem value="3">3 dias antes</SelectItem>
                        <SelectItem value="5">5 dias antes</SelectItem>
                        <SelectItem value="7">1 semana antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea placeholder="Notas adicionais..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
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
