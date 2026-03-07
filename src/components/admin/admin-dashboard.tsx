"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

interface DashboardStats {
  totalUsers: number
  monthlyRevenue: string
  activeSubscriptions: number
  churnRate: string
}

interface PlanDistribution {
  FREE: number
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

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlan, setFilterPlan] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      fetchDashboardData() // Recarregar dados
    } catch (error) {
      console.error("Error executing action:", error)
      toast.error("Erro ao executar ação")
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

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
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(parseFloat(data.stats.monthlyRevenue)),
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      color: "emerald",
    },
    {
      title: "Assinaturas Ativas",
      value: data.stats.activeSubscriptions.toLocaleString('pt-BR'),
      change: "+15.3%",
      trend: "up",
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Taxa de Churn",
      value: `${data.stats.churnRate}%`,
      change: "-0.5%",
      trend: "down",
      icon: TrendingDown,
      color: "rose",
    },
  ]

  const planDistributionData = [
    { plan: "Gratuito", users: data.planDistribution.FREE, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.FREE / data.planDistribution.total) * 100) : 0, color: "bg-slate-500" },
    { plan: "Premium", users: data.planDistribution.PRO, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.PRO / data.planDistribution.total) * 100) : 0, color: "bg-amber-500" },
    { plan: "Business", users: data.planDistribution.BUSINESS, percentage: data.planDistribution.total > 0 ? Math.round((data.planDistribution.BUSINESS / data.planDistribution.total) * 100) : 0, color: "bg-emerald-500" },
  ]

  const filteredUsers = data.recentUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = filterPlan === "all" || user.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    Usuários Recentes
                  </CardTitle>
                  <CardDescription>Gerencie os usuários da plataforma</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      className="pl-10 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="FREE">Gratuito</SelectItem>
                      <SelectItem value="PRO">Premium</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === user.id}>
                              {actionLoading === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Distribution */}
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
                <Button className="w-full" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Relatório Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-500" />
                  Transações Recentes
                </CardTitle>
                <CardDescription>Últimas assinaturas e pagamentos</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</p>
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
                        <td className="py-3 px-4">{tx.user}</td>
                        <td className="py-3 px-4 text-muted-foreground">{tx.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                            {tx.plan}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
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
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-700 text-slate-300"
                  onClick={fetchDashboardData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
