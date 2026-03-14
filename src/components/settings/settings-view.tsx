"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  Camera,
  Mail,
  Lock,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Check,
  Settings,
  Crown,
  Calendar,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { AdminLoginModal } from "@/components/admin/admin-login-modal"
import { toast } from "sonner"

// Lista de emails autorizados a acessar o admin
const ADMIN_EMAILS = [
  "jonnyarley379@gmail.com",
]

const plans = [
  {
    id: "FREE",
    name: "Gratuito",
    price: 0,
    productId: null,
    features: ["Até 50 transações/mês", "1 conta bancária", "1 cartão", "1 meta financeira", "5 categorias", "Calendário financeiro"],
  },
  {
    id: "BASIC",
    name: "Básico",
    price: 14.90,
    productId: "basic_monthly",
    yearlyProductId: "basic_yearly",
    yearlyPrice: 149.90,
    features: ["Transações ilimitadas", "Até 3 contas", "Até 2 cartões", "Até 3 metas", "Até 3 orçamentos", "Transações recorrentes", "Lembretes de contas", "3 relatórios IA/mês"],
    badge: "Novo",
  },
  {
    id: "PRO",
    name: "Premium",
    price: 24.90,
    productId: "pro_monthly",
    yearlyProductId: "pro_yearly",
    yearlyPrice: 249.90,
    features: ["Tudo do Básico +", "Contas ilimitadas", "Cartões ilimitados", "10 relatórios IA/mês", "IA Categorização automática", "Exportar dados (PDF, CSV, Excel)", "Integração bancária"],
    popular: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 49.90,
    productId: "business_monthly",
    yearlyProductId: "business_yearly",
    yearlyPrice: 499.90,
    features: ["Tudo do Premium +", "Relatórios IA ilimitados", "Família/Compartilhamento", "Metas em conjunto", "API de integração", "Relatórios personalizados", "Suporte dedicado 24/7"],
    badge: "Família",
  },
]

// Dados de exemplo para os planos
const planFeatures = {
  FREE: ["Até 50 transações/mês", "1 conta bancária", "1 cartão", "1 meta financeira", "5 categorias", "Calendário financeiro"],
  BASIC: ["Transações ilimitadas", "Até 3 contas", "Até 2 cartões", "Até 3 metas", "Até 3 orçamentos", "Transações recorrentes", "Lembretes de contas", "3 relatórios IA/mês"],
  PRO: ["Tudo do Básico +", "Contas ilimitadas", "Cartões ilimitados", "10 relatórios IA/mês", "IA Categorização automática", "Exportar dados (PDF, CSV, Excel)", "Integração bancária"],
  BUSINESS: ["Tudo do Premium +", "Relatórios IA ilimitados", "Família/Compartilhamento", "Metas em conjunto", "API de integração", "Relatórios personalizados", "Suporte dedicado 24/7"],
}

// Componente de Status da Assinatura
function SubscriptionStatus({ subscription, isLoading }: { subscription: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription || subscription.plan === "FREE") {
    return (
      <Card className="border-0 shadow-lg border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Plano Gratuito</h3>
              <p className="text-sm text-muted-foreground">
                Faça upgrade para desbloquear todos os recursos!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isExpired = subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) < new Date()
  const daysLeft = subscription.subscriptionEnd 
    ? Math.ceil((new Date(subscription.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Card className="border-0 shadow-lg border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Plano {subscription.plan}</CardTitle>
              <CardDescription>
                {subscription.isActive ? "Assinatura ativa" : "Assinatura inativa"}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={subscription.isActive ? "default" : "destructive"}
            className={subscription.isActive ? "bg-emerald-500" : ""}
          >
            {subscription.isActive ? "Ativo" : isExpired ? "Expirado" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/10">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Válido até</p>
              <p className="font-medium">
                {subscription.subscriptionEnd 
                  ? new Date(subscription.subscriptionEnd).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/10">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Renovação</p>
              <p className="font-medium">
                {subscription.autoRenewing ? "Automática" : "Manual"}
              </p>
            </div>
          </div>
        </div>

        {daysLeft > 0 && daysLeft <= 7 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              Sua assinatura expira em {daysLeft} dias. Renove para não perder acesso!
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            // Abrir Google Play para gerenciar assinatura
            window.open("https://play.google.com/store/account/subscriptions", "_blank")
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Gerenciar no Google Play
        </Button>
      </CardContent>
    </Card>
  )
}

export function SettingsView() {
  const router = useRouter()
  const { user, settingsTab, setSettingsTab, setIsAdmin } = useAppStore()
  const { theme, setTheme } = useTheme()
  
  // Estado da assinatura
  const [subscription, setSubscription] = useState<any>(null)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true)
  
  // Estado do modal de login admin
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  
  // Verificar se o usuário é admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  
  // Handler para sucesso no login admin
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true)
    setIsAdminModalOpen(false)
    toast.success("Login admin realizado! Redirecionando...")
    setTimeout(() => {
      router.push("/admin")
    }, 500)
  }
  
  // Carregar dados da assinatura
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscriptions/")
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setIsSubscriptionLoading(false)
      }
    }
    
    fetchSubscription()
  }, [])
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    alerts: true,
    weekly: false,
    marketing: false,
  })
  
  // Estado do perfil usando dados do usuário logado
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "BRL",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
  })
  
  // Carregar dados do perfil do usuário
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        currency: "BRL",
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
      })
    }
  }, [user])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Configurações
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Gerencie sua conta e preferências
        </motion.p>
      </div>

      <Tabs value={settingsTab} onValueChange={setSettingsTab} className="space-y-6">
        {/* Mobile: Scroll horizontal com ícones e textos */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <TabsList className="flex w-max min-w-full gap-1 bg-muted p-1 rounded-lg">
            <TabsTrigger value="profile" className="gap-2 px-3 py-2 flex-shrink-0">
              <User className="h-4 w-4" />
              <span className="text-sm">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 px-3 py-2 flex-shrink-0">
              <Bell className="h-4 w-4" />
              <span className="text-sm">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 px-3 py-2 flex-shrink-0">
              <Palette className="h-4 w-4" />
              <span className="text-sm">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 px-3 py-2 flex-shrink-0">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 px-3 py-2 flex-shrink-0">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Assinatura</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop: Grid normal */}
        <TabsList className="hidden md:grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span>Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Assinatura</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seus dados pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-emerald-500/30">
                      <AvatarImage src={user?.image || undefined} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="icon" 
                      className="absolute -bottom-1 -right-1 rounded-full h-8 w-8 bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name || "Usuário"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                    <Badge variant="secondary" className="mt-2">
                      {subscription?.plan === "FREE" || !subscription ? "Plano Gratuito" : `Plano ${subscription.plan}`}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input 
                      id="name" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email"
                        className="pl-10"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select value={profile.currency} onValueChange={(v) => setProfile({ ...profile, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={profile.language} onValueChange={(v) => setProfile({ ...profile, language: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/users/profile", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(profile),
                        })
                        if (response.ok) {
                          toast.success("Perfil atualizado com sucesso!")
                        } else {
                          toast.error("Erro ao atualizar perfil")
                        }
                      } catch (error) {
                        toast.error("Erro ao atualizar perfil")
                      }
                    }}
                  >Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Access Card - Only show for authorized users */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Painel Administrativo</CardTitle>
                        <CardDescription>
                          Acesso restrito a administradores
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você tem acesso ao painel administrativo do Monetra. 
                      Nele você pode gerenciar usuários, visualizar transações, 
                      configurar o sistema e muito mais.
                    </p>
                    <Button 
                      onClick={() => setIsAdminModalOpen(true)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Acessar Painel Admin
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como deseja receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { id: "email", label: "Notificações por Email", description: "Receba alertas no seu email", icon: Mail },
                  { id: "push", label: "Notificações Push", description: "Alertas no navegador", icon: Bell },
                  { id: "alerts", label: "Alertas de Gastos", description: "Aviso quando atingir limites", icon: Shield },
                  { id: "weekly", label: "Resumo Semanal", description: "Relatório semanal por email", icon: Globe },
                  { id: "marketing", label: "Comunicações de Marketing", description: "Novidades e promoções", icon: CreditCard },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.id as keyof typeof notifications]}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, [item.id]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize a aparência do aplicativo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Claro", icon: Sun },
                      { id: "dark", label: "Escuro", icon: Moon },
                      { id: "system", label: "Sistema", icon: Monitor },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          theme === t.id 
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                            : "border-border hover:border-emerald-500/50"
                        }`}
                      >
                        <t.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{t.label}</span>
                        {theme === t.id && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" />
                </div>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">Atualizar Senha</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Autenticação de Dois Fatores</CardTitle>
                <CardDescription>Adicione uma camada extra de segurança</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">2FA via Aplicativo</p>
                    <p className="text-sm text-muted-foreground">Use Google Authenticator ou similar</p>
                  </div>
                </div>
                <Button variant="outline">Ativar</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status da Assinatura Atual */}
            <SubscriptionStatus subscription={subscription} isLoading={isSubscriptionLoading} />
            
            {/* Planos Disponíveis */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Planos Disponíveis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {plans.map((plan) => {
                  const isCurrentPlan = subscription?.plan === plan.id
                  
                  return (
                    <Card 
                      key={plan.id}
                      className={`border-0 shadow-lg relative overflow-hidden ${
                        plan.popular ? "ring-2 ring-amber-500" : ""
                      } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
                    >
                      {(plan.popular || plan.badge) && (
                        <div className={`absolute top-0 right-0 text-white text-xs px-3 py-1 rounded-bl-lg ${
                          plan.popular ? "bg-amber-500" : "bg-purple-500"
                        }`}>
                          {plan.popular ? "Mais Popular" : plan.badge}
                        </div>
                      )}
                      {isCurrentPlan && (
                        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-br-lg">
                          Plano Atual
                        </div>
                      )}
                      <CardHeader className={isCurrentPlan || plan.popular || plan.badge ? "pt-10" : ""}>
                        <div className="flex items-center gap-2">
                          {plan.id !== "FREE" && <Crown className="h-5 w-5 text-amber-500" />}
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">
                            {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                          </span>
                          {plan.price > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
                        </div>
                        {plan.yearlyPrice && (
                          <p className="text-xs text-muted-foreground">
                            ou R$ {plan.yearlyPrice.toFixed(2).replace(".", ",")}/ano (2 meses grátis)
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-1.5">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs">
                              <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {plan.productId && (
                          <Button 
                            size="sm"
                            className={`w-full ${
                              isCurrentPlan 
                                ? "bg-muted text-muted-foreground" 
                                : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                            }`}
                            disabled={isCurrentPlan}
                            onClick={() => {
                              alert(`Em produção, isso abriria o Google Play para comprar: ${plan.productId}`)
                            }}
                          >
                            {isCurrentPlan ? "Plano Atual" : "Assinar"}
                          </Button>
                        )}
                        
                        {!plan.productId && (
                          <Button 
                            size="sm"
                            className="w-full bg-muted text-muted-foreground"
                            disabled
                          >
                            Plano Gratuito
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
            
            {/* Info sobre Google Play */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Pagamento Seguro via Google Play</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todas as assinaturas são processadas de forma segura pelo Google Play Store. 
                      Você pode cancelar a qualquer momento nas configurações da sua conta Google.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Modal de Login Admin */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  )
}
