"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Wallet, 
  CreditCard,
  Building2,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Link2,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Banknote,
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
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Account {
  id: string
  name: string
  type: string
  currentBalance: number
  color: string | null
  icon: string | null
  bankName: string | null
  isDefault: boolean
  transactionCount: number
}

interface CardData {
  id: string
  name: string
  type: string
  brand: string | null
  lastDigits: string | null
  limit: number
  usedLimit: number
  availableLimit: number
  closingDay: number
  dueDay: number
  color: string | null
  transactionCount: number
}

const accountTypes: Record<string, { label: string; icon: React.ReactNode }> = {
  CHECKING: { label: "Conta Corrente", icon: <Building2 className="h-4 w-4" /> },
  SAVINGS: { label: "Poupança", icon: <Wallet className="h-4 w-4" /> },
  INVESTMENT: { label: "Investimento", icon: <TrendingUp className="h-4 w-4" /> },
  WALLET: { label: "Carteira", icon: <Wallet className="h-4 w-4" /> },
  OTHER: { label: "Outros", icon: <Wallet className="h-4 w-4" /> },
}

const accountColors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316"]

// Bancos brasileiros para Open Banking
const brazilianBanks = [
  { code: "260", name: "Nubank", logo: "💜" },
  { code: "077", name: "Banco Inter", logo: "🧡" },
  { code: "323", name: "Mercado Pago", logo: "💙" },
  { code: "341", name: "Itaú", logo: "🟠" },
  { code: "001", name: "Banco do Brasil", logo: "🟡" },
  { code: "033", name: "Santander", logo: "🔴" },
  { code: "745", name: "Citibank", logo: "🔵" },
  { code: "104", name: "Caixa", logo: "🟤" },
  { code: "756", name: "Sicoob", logo: "🟢" },
  { code: "748", name: "Sicredi", logo: "💚" },
]

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isBankConnectOpen, setIsBankConnectOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    duplicates: number
    errors: number
  } | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [connectedBanks, setConnectedBanks] = useState<any[]>([])

  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "CHECKING",
    balance: "",
    bankName: "",
  })
  const [newCard, setNewCard] = useState({
    name: "",
    type: "CREDIT",
    brand: "",
    limit: "",
    closingDay: "10",
    dueDay: "15",
  })

  useEffect(() => {
    fetchData()
    fetchConnectedBanks()
  }, [])

  const fetchConnectedBanks = async () => {
    try {
      const response = await fetch("/api/bank-connections/")
      if (response.ok) {
        const data = await response.json()
        setConnectedBanks(data.connections || [])
      }
    } catch (error) {
      console.error("Error fetching bank connections:", error)
    }
  }

  const fetchData = async () => {
    try {
      const [accRes, cardRes] = await Promise.all([
        fetch("/api/accounts/"),
        fetch("/api/cards/")
      ])

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

  const handleCreateAccount = async () => {
    if (!newAccount.name) {
      toast.error("Nome da conta é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/accounts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccount.name,
          type: newAccount.type,
          initialBalance: parseFloat(newAccount.balance) || 0,
          bankName: newAccount.bankName || null,
          color: accountColors[accounts.length % accountColors.length],
        }),
      })

      if (!response.ok) throw new Error("Erro ao criar conta")

      toast.success("Conta criada com sucesso!")
      setIsAddAccountOpen(false)
      setNewAccount({ name: "", type: "CHECKING", balance: "", bankName: "" })
      fetchData()
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("Erro ao criar conta")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCard = async () => {
    if (!newCard.name || !newCard.limit) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/cards/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCard.name,
          type: newCard.type,
          brand: newCard.brand || null,
          limit: parseFloat(newCard.limit) || 0,
          closingDay: parseInt(newCard.closingDay) || 10,
          dueDay: parseInt(newCard.dueDay) || 15,
          color: accountColors[cards.length % accountColors.length],
        }),
      })

      if (!response.ok) throw new Error("Erro ao criar cartão")

      toast.success("Cartão criado com sucesso!")
      setIsAddCardOpen(false)
      setNewCard({ name: "", type: "CREDIT", brand: "", limit: "", closingDay: "10", dueDay: "15" })
      fetchData()
    } catch (error) {
      console.error("Error creating card:", error)
      toast.error("Erro ao criar cartão")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/accounts/?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir conta")

      toast.success("Conta excluída!")
      fetchData()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Erro ao excluir conta")
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      const response = await fetch(`/api/cards/?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir cartão")

      toast.success("Cartão excluído!")
      fetchData()
    } catch (error) {
      console.error("Error deleting card:", error)
      toast.error("Erro ao excluir cartão")
    }
  }

  // Função para importar arquivo
  const handleFileImport = async (file: File) => {
    setIsImporting(true)
    setImportResult(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      // Usar conta selecionada ou a primeira conta disponível
      const targetAccountId = selectedAccountId || (accounts.length > 0 ? accounts[0].id : null)
      if (targetAccountId) {
        formData.append("accountId", targetAccountId)
      }

      const response = await fetch("/api/imports/", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar arquivo")
      }

      setImportResult({
        imported: data.imported || 0,
        duplicates: data.duplicates || 0,
        errors: data.errors || 0,
      })

      if (data.imported > 0) {
        toast.success(`${data.imported} transações importadas com sucesso!`)
        fetchData()
      } else if (data.duplicates > 0) {
        toast.info(`${data.duplicates} transações duplicadas foram ignoradas`)
      } else {
        toast.warning("Nenhuma transação nova encontrada no arquivo")
      }

    } catch (error) {
      console.error("Error importing file:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao importar arquivo")
    } finally {
      setIsImporting(false)
    }
  }

  const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0)
  const totalCreditUsed = cards.reduce((acc, c) => acc + c.usedLimit, 0)
  const totalCreditLimit = cards.reduce((acc, c) => acc + c.limit, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando contas...</p>
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
            Contas & Cartões
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground"
          >
            Gerencie suas contas bancárias e cartões de crédito
          </motion.p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova Conta</span>
                <span className="sm:hidden">Conta</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Conta</DialogTitle>
                <DialogDescription>Adicione uma nova conta bancária</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome da Conta *</Label>
                  <Input
                    placeholder="Ex: Nubank, Itaú..."
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newAccount.type} onValueChange={(v) => setNewAccount({ ...newAccount, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                      <SelectItem value="SAVINGS">Poupança</SelectItem>
                      <SelectItem value="INVESTMENT">Investimento</SelectItem>
                      <SelectItem value="WALLET">Carteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Saldo Inicial</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nome do Banco</Label>
                  <Input
                    placeholder="Ex: Nubank, Banco do Brasil..."
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancelar</Button>
                  <Button className="bg-gradient-to-r from-amber-500 to-yellow-600" onClick={handleCreateAccount} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 flex-1 sm:flex-initial">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Novo Cartão</span>
                <span className="sm:hidden">Cartão</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Cartão</DialogTitle>
                <DialogDescription>Adicione um novo cartão de crédito</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome do Cartão *</Label>
                  <Input
                    placeholder="Ex: Nubank Mastercard"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Bandeira</Label>
                    <Select onValueChange={(v) => setNewCard({ ...newCard, brand: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visa">Visa</SelectItem>
                        <SelectItem value="Mastercard">Mastercard</SelectItem>
                        <SelectItem value="Elo">Elo</SelectItem>
                        <SelectItem value="American Express">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Limite *</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={newCard.limit}
                      onChange={(e) => setNewCard({ ...newCard, limit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Dia Fechamento</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newCard.closingDay}
                      onChange={(e) => setNewCard({ ...newCard, closingDay: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Dia Vencimento</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={newCard.dueDay}
                      onChange={(e) => setNewCard({ ...newCard, dueDay: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddCardOpen(false)}>Cancelar</Button>
                  <Button className="bg-gradient-to-r from-amber-500 to-yellow-600" onClick={handleCreateCard} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bank Integration Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 relative overflow-hidden">
        <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px]">Em breve</Badge>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Integração Bancária Automática
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">Próxima atualização</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conecte seus bancos para sincronizar transações automaticamente via Open Banking
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="opacity-60"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar OFX/CSV
              </Button>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 opacity-60"
                disabled
              >
                <Link2 className="h-4 w-4 mr-2" />
                Conectar Banco
              </Button>
            </div>
          </div>
          
          {/* Info box */}
          <div className="mt-4 p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Novidade em breve!</strong> A integração automática com bancos via Open Banking estará disponível em uma próxima atualização. 
              Por enquanto, você pode importar suas transações manualmente através de arquivos CSV ou Excel na seção de Transações.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Saldo Total</p>
                  <p className="text-xl md:text-2xl font-bold truncate">{formatCurrency(totalBalance)}</p>
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
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Fatura Atual</p>
                  <p className="text-xl md:text-2xl font-bold truncate">{formatCurrency(totalCreditUsed)}</p>
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
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Limite Disponível</p>
                  <p className="text-xl md:text-2xl font-bold truncate">{formatCurrency(totalCreditLimit - totalCreditUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Accounts */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Contas Bancárias ({accounts.length})</h2>
        {accounts.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma conta cadastrada</p>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-yellow-600"
                onClick={() => setIsAddAccountOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
                  <div 
                    className="h-2"
                    style={{ backgroundColor: account.color || "#f59e0b" }}
                  />
                  <CardHeader className="pb-2 p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div 
                          className="p-1.5 md:p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${account.color || "#f59e0b"}20` }}
                        >
                          {accountTypes[account.type]?.icon || <Wallet className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base md:text-lg truncate">{account.name}</CardTitle>
                          <CardDescription className="text-[10px] md:text-xs flex items-center gap-1 flex-wrap">
                            {accountTypes[account.type]?.label || "Conta"}
                            {account.isDefault && (
                              <Badge variant="secondary" className="text-[10px]">Principal</Badge>
                            )}
                          </CardDescription>
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
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteAccount(account.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 md:pb-4 px-3 md:px-4">
                    <p className="text-xl md:text-2xl font-bold truncate">{formatCurrency(account.currentBalance)}</p>
                    {account.bankName && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{account.bankName}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cards */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Cartões de Crédito ({cards.length})</h2>
        {cards.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum cartão cadastrado</p>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-yellow-600"
                onClick={() => setIsAddCardOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {cards.map((card, index) => {
              const usagePercentage = card.limit > 0 ? (card.usedLimit / card.limit) * 100 : 0
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden group">
                    <div 
                      className="h-24 md:h-32 p-3 md:p-4 relative"
                      style={{ 
                        background: `linear-gradient(135deg, ${card.color || "#8b5cf6"}dd, ${card.color || "#8b5cf6"}88)` 
                      }}
                    >
                      <div className="absolute top-2 right-2 md:top-4 md:right-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 h-7 w-7 md:h-8 md:w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Ver Fatura</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteCard(card.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="h-full flex flex-col justify-between text-white">
                        <div>
                          <p className="text-xs md:text-sm opacity-80">{card.brand || "Cartão"}</p>
                          <p className="text-sm md:text-lg font-semibold truncate">{card.name}</p>
                        </div>
                        <div>
                          <p className="text-base md:text-xl font-bold">•••• {card.lastDigits || "****"}</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Limite usado</span>
                          <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={usagePercentage} 
                          className={cn(
                            "h-1.5 md:h-2",
                            usagePercentage > 80 ? "[&>div]:bg-rose-500" : 
                            usagePercentage > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                          )}
                        />
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Fatura</span>
                          <span className="font-semibold text-rose-500">{formatCurrency(card.usedLimit)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                          <span>Fech: dia {card.closingDay}</span>
                          <span>Venc: dia {card.dueDay}</span>
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

      {/* Modal: Conectar Banco */}
      <Dialog open={isBankConnectOpen} onOpenChange={setIsBankConnectOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Conectar Banco</DialogTitle>
            <DialogDescription>
              Selecione seu banco para sincronizar automaticamente suas transações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {brazilianBanks.map((bank) => (
                <button
                  key={bank.code}
                  onClick={async () => {
                    setIsConnecting(true)
                    try {
                      // Simular conexão Open Banking
                      const response = await fetch("/api/bank-connections/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bankCode: bank.code,
                          bankName: bank.name,
                        }),
                      })
                      
                      if (response.ok) {
                        toast.success(`${bank.name} conectado com sucesso!`)
                        setIsBankConnectOpen(false)
                        fetchConnectedBanks()
                      } else {
                        toast.info(`Em produção, isso abriria o OAuth do ${bank.name}`)
                      }
                    } catch (error) {
                      toast.error("Erro ao conectar banco")
                    } finally {
                      setIsConnecting(false)
                    }
                  }}
                  disabled={isConnecting}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-2xl">{bank.logo}</span>
                  <span className="font-medium text-sm">{bank.name}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>
                <strong>Recurso Premium:</strong> A integração automática requer configuração de API do Open Banking Brasil. 
                Por enquanto, use a importação de arquivo OFX/CSV.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Importar Arquivo */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        setIsImportOpen(open)
        if (!open) setImportResult(null)
      }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Extrato</DialogTitle>
            <DialogDescription>
              Importe transações de extratos bancários (OFX, CSV)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importResult ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-lg font-semibold">Importação Concluída!</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.imported}</p>
                    <p className="text-xs text-muted-foreground">Importadas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-2xl font-bold text-amber-600">{importResult.duplicates}</p>
                    <p className="text-xs text-muted-foreground">Duplicadas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20">
                    <p className="text-2xl font-bold text-rose-600">{importResult.errors}</p>
                    <p className="text-xs text-muted-foreground">Erros</p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600"
                  onClick={() => setIsImportOpen(false)}
                >
                  Concluir
                </Button>
              </div>
            ) : (
              <>
                {/* Account Selector */}
                {accounts.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Importar para a conta</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} {account.bankName ? `(${account.bankName})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para importar sem vincular a uma conta específica
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {isImporting ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                      <p className="text-sm text-muted-foreground">
                        Processando arquivo...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arraste seu arquivo aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: OFX, CSV
                      </p>
                      <input 
                        type="file" 
                        accept=".ofx,.csv"
                        className="hidden"
                        id="file-import"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            await handleFileImport(file)
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => document.getElementById("file-import")?.click()}
                      >
                        Selecionar Arquivo
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Como exportar do seu banco:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Nubank:</strong> App → Ajustes → Exportar dados → OFX</li>
                    <li>• <strong>Itaú:</strong> Site → Conta Corrente → Extrato → Exportar</li>
                    <li>• <strong>BB:</strong> App → Contas → Extrato → Compartilhar</li>
                    <li>• <strong>Santander:</strong> Site → Extrato → Download OFX</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
