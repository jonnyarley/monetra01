"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  RefreshCw,
  Loader2,
  LayoutDashboard,
  CreditCard,
  Settings,
  User,
  FileText,
  Bell,
  Database,
  LogOut,
  ChevronRight,
  X,
  Mail,
  Calendar,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// ==================== TIPOS ====================
interface DashboardStats {
  totalUsers: number
  monthlyRevenue: string
  activeSubscriptions: number
  churnRate: string
}

interface PlanDistribution {
  FREE: number
  BASIC: number
  PRO: number
  BUSINESS: number
  total: number
}

interface RecentUser {
  id: string
  name: string
  email: string
  plan: string
  status: string
  date: string
}

interface RecentTransaction {
  id: string
  user: string
  email: string
  plan: string
  amount: number
  date: string
}

interface DashboardData {
  stats: DashboardStats
  planDistribution: PlanDistribution
  recentUsers: RecentUser[]
  recentTransactions: RecentTransaction[]
}

// ==================== COMPONENTE PRINCIPAL ====================
export function AdminDashboard() {
  const router = useRouter()
  const [activePage, setActivePage] = useState("dashboard")
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlan, setFilterPlan] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Estado para modal de detalhes
  const [selectedUser, setSelectedUser] = useState<RecentUser | null>(null)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/")
      if (!response.ok) throw new Error("Erro ao carregar dados")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Erro ao carregar dados do dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleUserAction = async (userId: string, action: string, plan?: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch("/api/admin/users/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, plan }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao executar ação")
      }

      toast.success(`Ação "${action}" executada com sucesso!`)
      fetchDashboardData()
    } catch (error) {
      console.error("Error executing action:", error)
      toast.error("Erro ao executar ação")
    } finally {
      setActionLoading(null)
    }
  }

  // Menu de navegação
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "transactions", label: "Transações", icon: CreditCard },
    { id: "plans", label: "Planos", icon: BarChart3 },
    { id: "settings", label: "Configurações", icon: Settings },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar página ativa
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage data={data} onRefresh={fetchDashboardData} onNavigate={setActivePage} />
      case "users":
        return (
          <UsersPage
            data={data}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterPlan={filterPlan}
            setFilterPlan={setFilterPlan}
            actionLoading={actionLoading}
            handleUserAction={handleUserAction}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        )
      case "transactions":
        return <TransactionsPage data={data} />
      case "plans":
        return <PlansPage data={data} />
      case "settings":
        return <SettingsPage router={router} />
      default:
        return <DashboardPage data={data} onRefresh={fetchDashboardData} onNavigate={setActivePage} />
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activePage === item.id
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {activePage === item.id && (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* Perfil Admin */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <Avatar className="h-10 w-10 border-2 border-amber-500">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                JA
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Jonny Arley</p>
              <p className="text-xs text-slate-400 truncate">admin@monetra.com</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setActivePage("settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ==================== PÁGINA DASHBOARD ====================
function DashboardPage({ 
  data, 
  onRefresh, 
  onNavigate 
}: { 
  data: DashboardData | null
  onRefresh: () => void
  onNavigate: (page: string) => void
}) {
  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Usuários",
      value: data.stats.totalUsers.toLocaleString('pt-BR'),
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "amber",
      page: "users",
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(parseFloat(data.stats.monthlyRevenue)),
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      color: "emerald",
      page: "transactions",
    },
    {
      title: "Assinaturas Ativas",
      value: data.stats.activeSubscriptions.toLocaleString('pt-BR'),
      change: "+15.3%",
      trend: "up",
      icon: TrendingUp,
      color: "blue",
      page: "plans",
    },
    {
      title: "Taxa de Churn",
      value: `${data.stats.churnRate}%`,
      change: "-0.5%",
      trend: "down",
      icon: TrendingDown,
      color: "rose",
      page: "plans",
    },
  ]

  const planDistributionData = [
    { plan: "Gratuito", users: data.planDistribution.FREE, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.FREE / data.planDistribution.total) * 100) : 0, color: "bg-slate-500" },
    { plan: "Básico", users: data.planDistribution.BASIC, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.BASIC / data.planDistribution.total) * 100) : 0, color: "bg-blue-500" },
    { plan: "Premium", users: data.planDistribution.PRO, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.PRO / data.planDistribution.total) * 100) : 0, color: "bg-amber-500" },
    { plan: "Business", users: data.planDistribution.BUSINESS, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.BUSINESS / data.planDistribution.total) * 100) : 0, color: "bg-emerald-500" },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(stat.page)}
            className="cursor-pointer"
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow hover:border-amber-500/50 border-2 border-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={`text-sm ${stat.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-muted-foreground">vs mês anterior</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usuários Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    Usuários Recentes
                  </CardTitle>
                  <CardDescription>Últimos usuários cadastrados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate("users")}>
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={user.plan === "BUSINESS" ? "default" : user.plan === "PRO" ? "secondary" : "outline"}
                      className={user.plan === "BUSINESS" ? "bg-emerald-500" : user.plan === "PRO" ? "bg-amber-500 text-white" : ""}
                    >
                      {user.plan}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição de Planos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-500" />
                Distribuição de Planos
              </CardTitle>
              <CardDescription>Usuários por tipo de plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planDistributionData.map((plan) => (
                <div key={plan.plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.plan}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.users.toLocaleString('pt-BR')} ({plan.percentage}%)
                    </span>
                  </div>
                  <Progress value={plan.percentage} className="h-2" />
                </div>
              ))}

              <div className="pt-4 mt-4 border-t">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => onNavigate("plans")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gerenciar Planos
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Status do Sistema</h3>
                  <p className="text-slate-400">Todos os serviços operando normalmente</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-400">API Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-400">Database Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-400">Auth Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ==================== PÁGINA USUÁRIOS ====================
function UsersPage({
  data,
  searchQuery,
  setSearchQuery,
  filterPlan,
  setFilterPlan,
  actionLoading,
  handleUserAction,
  selectedUser,
  setSelectedUser,
}: {
  data: DashboardData | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterPlan: string
  setFilterPlan: (p: string) => void
  actionLoading: string | null
  handleUserAction: (userId: string, action: string, plan?: string) => void
  selectedUser: RecentUser | null
  setSelectedUser: (u: RecentUser | null) => void
}) {
  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  const filteredUsers = data.recentUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = filterPlan === "all" || user.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie todos os usuários da plataforma</p>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="FREE">Gratuito</SelectItem>
                <SelectItem value="BASIC">Básico</SelectItem>
                <SelectItem value="PRO">Premium</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Cadastrado em {user.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={user.plan === "BUSINESS" ? "default" : user.plan === "PRO" ? "secondary" : "outline"}
                      className={user.plan === "BUSINESS" ? "bg-emerald-500" : user.plan === "PRO" ? "bg-amber-500 text-white" : ""}
                    >
                      {user.plan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "border-emerald-500 text-emerald-500"
                          : user.status === "pending"
                          ? "border-amber-500 text-amber-500"
                          : "border-rose-500 text-rose-500"
                      }
                    >
                      {user.status === "active" ? "Ativo" : user.status === "pending" ? "Pendente" : "Inativo"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={actionLoading === user.id}>
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "upgrade", "BASIC")}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade para Básico
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "upgrade", "PRO")}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade para Premium
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "upgrade", "BUSINESS")}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade para Business
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleUserAction(user.id, "suspend")}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Usuário */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-xl shadow-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Detalhes do Usuário</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{selectedUser.name}</p>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <Badge
                      variant={selectedUser.plan === "BUSINESS" ? "default" : selectedUser.plan === "PRO" ? "secondary" : "outline"}
                      className={selectedUser.plan === "BUSINESS" ? "bg-emerald-500" : selectedUser.plan === "PRO" ? "bg-amber-500 text-white" : ""}
                    >
                      {selectedUser.plan}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.status === "active"
                          ? "border-emerald-500 text-emerald-500"
                          : selectedUser.status === "pending"
                          ? "border-amber-500 text-amber-500"
                          : "border-rose-500 text-rose-500"
                      }
                    >
                      {selectedUser.status === "active" ? "Ativo" : selectedUser.status === "pending" ? "Pendente" : "Inativo"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">{selectedUser.date}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Fechar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-600"
                  onClick={() => {
                    handleUserAction(selectedUser.id, "upgrade", "BUSINESS")
                    setSelectedUser(null)
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade para Business
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== PÁGINA TRANSAÇÕES ====================
function TransactionsPage({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Histórico de pagamentos e assinaturas</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">{formatCurrency(parseFloat(data.stats.monthlyRevenue))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-xl font-bold">{data.stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-xl font-bold">{data.stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Últimas assinaturas e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">As transações de assinatura aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plano</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{tx.user}</td>
                      <td className="py-3 px-4 text-muted-foreground">{tx.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          {tx.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== PÁGINA PLANOS ====================
function PlansPage({ data }: { data: DashboardData | null }) {
  const plans = [
    {
      id: "FREE",
      name: "Gratuito",
      price: 0,
      features: ["Até 50 transações/mês", "1 conta bancária", "1 cartão", "1 meta financeira", "5 categorias"],
      users: data?.planDistribution.FREE || 0,
      color: "slate",
    },
    {
      id: "BASIC",
      name: "Básico",
      price: 14.90,
      features: ["Transações ilimitadas", "Até 3 contas", "Até 2 cartões", "Até 3 metas", "3 relatórios IA/mês"],
      users: data?.planDistribution.BASIC || 0,
      color: "blue",
    },
    {
      id: "PRO",
      name: "Premium",
      price: 24.90,
      features: ["Tudo do Básico +", "Contas ilimitadas", "Cartões ilimitados", "10 relatórios IA/mês", "Exportar dados"],
      users: data?.planDistribution.PRO || 0,
      color: "amber",
      popular: true,
    },
    {
      id: "BUSINESS",
      name: "Business",
      price: 49.90,
      features: ["Tudo do Premium +", "Relatórios IA ilimitados", "API de integração", "Relatórios personalizados", "Suporte 24/7"],
      users: data?.planDistribution.BUSINESS || 0,
      color: "emerald",
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-muted-foreground">Gerencie os planos de assinatura</p>
      </div>

      {/* Stats de Receita */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80">Receita Mensal Estimada</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(parseFloat(data?.stats.monthlyRevenue || "0"))}</p>
            </div>
            <DollarSign className="h-12 w-12 text-white/30" />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`border-0 shadow-lg relative overflow-hidden ${
              plan.popular ? "ring-2 ring-amber-500" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-${plan.color}-100 dark:bg-${plan.color}-900/30`}>
                  <CreditCard className={`h-5 w-5 text-${plan.color}-600`} />
                </div>
                {plan.name}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {plan.price === 0 ? "Grátis" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Usuários ativos</p>
                <p className="text-2xl font-bold">{plan.users}</p>
              </div>
              <Separator />
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribuição Visual */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Distribuição de Usuários por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan) => {
              const percentage = data?.planDistribution.total && data.planDistribution.total > 0
                ? Math.round((plan.users / data.planDistribution.total) * 100)
                : 0
              return (
                <div key={plan.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.users} usuários ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== PÁGINA CONFIGURAÇÕES ====================
function SettingsPage({ router }: { router: ReturnType<typeof useRouter> }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/admin/logout/", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações do painel administrativo</p>
      </div>

      {/* Perfil Admin */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-500" />
            Perfil do Administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-amber-500">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl font-bold">
                JA
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold">Jonny Arley</p>
              <p className="text-muted-foreground">jonnyarley379@gmail.com</p>
              <Badge className="mt-2 bg-emerald-500">Administrador</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Alertas de novos usuários</p>
                <p className="text-sm text-muted-foreground">Receba notificação quando um novo usuário se cadastrar</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500">Ativo</Badge>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Alertas de pagamento</p>
                <p className="text-sm text-muted-foreground">Receba notificação de novos pagamentos</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500">Ativo</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sistema */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Versão do Sistema</p>
              <p className="font-bold text-lg">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Ambiente</p>
              <p className="font-bold text-lg text-emerald-500">Produção</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="font-bold text-lg">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-bold text-lg text-emerald-500">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="border-0 shadow-lg border-2 border-red-200 dark:border-red-900/30">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sair do Painel Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
