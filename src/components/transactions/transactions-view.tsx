"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  X as XIcon,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  date: Date
  isPaid: boolean
  account: { id: string; name: string } | null
  card: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null; color: string | null } | null
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface Account {
  id: string
  name: string
  type: string
}

interface CardData {
  id: string
  name: string
  type: string
}

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, count: 0 })

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "INCOME" | "EXPENSE">("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<{date: string; description: string; amount: number}[]>([])
  const [importAccountId, setImportAccountId] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newTransaction, setNewTransaction] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    description: "",
    amount: "",
    categoryId: "",
    accountId: "",
    cardId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  // Carregar dados
  const fetchData = async () => {
    try {
      const [transRes, catRes, accRes, cardRes] = await Promise.all([
        fetch("/api/transactions/"),
        fetch("/api/categories/"),
        fetch("/api/accounts/"),
        fetch("/api/cards/")
      ])

      if (transRes.ok) {
        const transData = await transRes.json()
        setTransactions(transData.transactions || [])
        setSummary(transData.summary || { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 })
      }

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }

      if (accRes.ok) {
        const accData = await accRes.json()
        setAccounts(accData.accounts || [])
      }

      if (cardRes.ok) {
        const cardData = await cardRes.json()
        setCards(cardData.cards || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Criar transação
  const handleCreateTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/transactions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newTransaction.type,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          date: newTransaction.date,
          categoryId: newTransaction.categoryId || null,
          accountId: newTransaction.accountId || null,
          cardId: newTransaction.cardId || null,
          notes: newTransaction.notes || null,
          isPaid: true,
        }),
      })

      if (!response.ok) throw new Error("Erro ao criar transação")

      toast.success("Transação criada com sucesso!")
      setIsAddModalOpen(false)
      setNewTransaction({
        type: "EXPENSE",
        description: "",
        amount: "",
        categoryId: "",
        accountId: "",
        cardId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast.error("Erro ao criar transação")
    } finally {
      setIsSaving(false)
    }
  }

  // Deletar transação
  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir transação")

      toast.success("Transação excluída!")
      fetchData()
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Erro ao excluir transação")
    }
  }

  // Categorizar transações com IA
  const [isCategorizing, setIsCategorizing] = useState(false)
  
  const handleAICategorize = async () => {
    if (transactions.length === 0) {
      toast.error("Nenhuma transação para categorizar")
      return
    }
    
    setIsCategorizing(true)
    try {
      // Filtrar transações sem categoria
      const uncategorized = transactions.filter(t => !t.category)
      
      if (uncategorized.length === 0) {
        toast.success("Todas as transações já estão categorizadas!")
        return
      }
      
      const response = await fetch("/api/ai-categorize/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: uncategorized.map(t => ({
            id: t.id,
            description: t.description
          })),
          useAI: true
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Aplicar categorizações
        let applied = 0
        for (const result of data.results) {
          if (result.categoryId) {
            await fetch("/api/ai-categorize/", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transactionId: result.transactionId,
                categoryId: result.categoryId
              })
            })
            applied++
          }
        }
        
        toast.success(`${applied} transações categorizadas com IA!`)
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("AI categorization error:", error)
      toast.error("Erro ao categorizar com IA")
    } finally {
      setIsCategorizing(false)
    }
  }

  // Parse CSV file
  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim())
    const transactions: {date: string; description: string; amount: number}[] = []
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('data') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[;,\t]/).map(p => p.trim().replace(/"/g, ''))
      if (parts.length >= 2) {
        let date = '', description = '', amount = 0
        
        // Try to detect format
        for (const part of parts) {
          if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(part) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(part)) {
            date = part
          } else if (/^-?\d+[,.]?\d*$/.test(part.replace(/[R$\s]/g, ''))) {
            amount = parseFloat(part.replace(/[R$\s,.]/g, match => match === ',' ? '.' : match === '.' ? '' : match))
          } else if (part.length > 2 && !date) {
            description = part
          }
        }
        
        if (date && (description || amount)) {
          transactions.push({ date, description: description || 'Importado', amount })
        }
      }
    }
    return transactions
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      setImportedData(parsed)
    }
    reader.readAsText(file)
  }

  // Handle import
  const handleImport = async () => {
    if (importedData.length === 0) {
      toast.error("Nenhum dado para importar")
      return
    }
    
    setIsImporting(true)
    try {
      const response = await fetch("/api/imports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: importedData,
          accountId: importAccountId || null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`${data.imported} transações importadas com sucesso!`)
        if (data.errors > 0) {
          toast.warning(`${data.errors} transações não puderam ser importadas`)
        }
        setIsImportModalOpen(false)
        setImportedData([])
        setImportAccountId("")
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Erro ao importar transações")
    } finally {
      setIsImporting(false)
    }
  }

  // Filtrar transações
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || t.type === filterType
    const matchesCategory = filterCategory === "all" || t.category?.id === filterCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const totalIncome = summary.totalIncome
  const totalExpense = summary.totalExpense

  const filteredCategories = categories.filter(c => c.type === newTransaction.type)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando transações...</p>
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
            Transações
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Gerencie suas receitas e despesas
          </motion.p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none text-purple-600 border-purple-300 hover:bg-purple-50"
            onClick={handleAICategorize}
            disabled={isCategorizing}
          >
            {isCategorizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Categorizar IA
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription>
                Adicione uma nova receita ou despesa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs value={newTransaction.type} onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v as "INCOME" | "EXPENSE" })}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EXPENSE" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white text-xs md:text-sm">
                    Despesa
                  </TabsTrigger>
                  <TabsTrigger value="INCOME" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs md:text-sm">
                    Receita
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Supermercado, Salário..."
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select value={newTransaction.categoryId} onValueChange={(v) => setNewTransaction({ ...newTransaction, categoryId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Conta</Label>
                    <Select value={newTransaction.accountId} onValueChange={(v) => setNewTransaction({ ...newTransaction, accountId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione detalhes..."
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600"
                  onClick={handleCreateTransaction}
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

        {/* Import Modal */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                Importar Extrato
              </DialogTitle>
              <DialogDescription>
                Importe transações de arquivo CSV ou OFX
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.ofx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-amber-500 transition-colors"
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Clique para selecionar arquivo</p>
                <p className="text-sm text-muted-foreground mt-1">CSV ou OFX</p>
              </div>
              
              {importedData.length > 0 && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium">{importedData.length} transções encontradas</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Conta de destino (opcional)</Label>
                    <Select value={importAccountId} onValueChange={setImportAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importedData.slice(0, 5).map((tx, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span className="truncate flex-1">{tx.description}</span>
                        <span className={tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                    ))}
                    {importedData.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{importedData.length - 5} mais transações
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsImportModalOpen(false)
                setImportedData([])
              }}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-yellow-600"
                onClick={handleImport}
                disabled={isImporting || importedData.length === 0}
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Importar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Receitas</p>
                  <p className="text-lg md:text-xl font-bold text-amber-600 truncate">{formatCurrency(totalIncome)}</p>
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500/10 to-pink-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Despesas</p>
                  <p className="text-lg md:text-xl font-bold text-rose-600 truncate">{formatCurrency(totalExpense)}</p>
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
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Balanço</p>
                  <p className={`text-lg md:text-xl font-bold truncate ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "INCOME" | "EXPENSE")}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="INCOME">Receitas</SelectItem>
                    <SelectItem value="EXPENSE">Despesas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="hidden sm:flex" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Nenhuma transação encontrada</p>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Transação
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence>
                  {filteredTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                        <div className={`p-2 md:p-3 rounded-xl flex-shrink-0 ${
                          transaction.type === "INCOME" 
                            ? "bg-emerald-100 dark:bg-emerald-900/30" 
                            : "bg-rose-100 dark:bg-rose-900/30"
                        }`}>
                          {transaction.type === "INCOME" ? (
                            <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {transaction.category && (
                              <Badge variant="secondary" className="text-[10px] md:text-xs">
                                {transaction.category.name}
                              </Badge>
                            )}
                            {transaction.account && (
                              <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
                                {transaction.account.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className={`font-semibold text-sm md:text-base ${
                            transaction.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                            {formatDate(transaction.date.toString())}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
