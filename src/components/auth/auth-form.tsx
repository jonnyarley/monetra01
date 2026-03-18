"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/store"
import { AdminLoginModal } from "@/components/admin/admin-login-modal"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const { setUser, setAuthenticated, setAuthLoading, setIsAdmin } = useAppStore()
  const router = useRouter()

  // Modal de login admin
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  
  // Modal de esqueceu a senha
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  // Atalho secreto para admin: clicar 5 vezes no logo
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSecretAdminAccess = () => {
    clickCountRef.current += 1

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0
      setIsAdminModalOpen(true)
      return
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 2000)
  }

  const handleAdminLoginSuccess = () => {
    setUser({
      id: "admin_1",
      email: "jonnyarley379@gmail.com",
      name: "Jonny Arley",
      image: null,
      plan: "BUSINESS",
      currency: "BRL",
      language: "pt-BR",
      theme: "system",
      financialScore: 850,
      totalPoints: 2500,
      level: 5,
      role: "admin",
    })
    setAuthenticated(true)
    setIsAdmin(true)
    toast.success("Login admin realizado! Redirecionando para o painel...")
    setIsAdminModalOpen(false)
  }

  // Verificar se já está autenticado ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me/")
        const data = await response.json()

        if (data.authenticated && data.user) {
          setUser(data.user)
          setAuthenticated(true)
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [setUser, setAuthenticated, setAuthLoading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao fazer login")
        return
      }

      setUser(data.user)
      setAuthenticated(true)
      toast.success("Login realizado com sucesso!")

    } catch (error) {
      console.error("Login error:", error)
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (formData.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres")
      return
    }

    if (!formData.acceptTerms) {
      toast.error("Você deve aceitar os termos de uso")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          acceptTerms: formData.acceptTerms,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao criar conta")
        return
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      setActiveTab("login")
      setFormData({
        name: "",
        email: formData.email,
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      })

    } catch (error) {
      console.error("Register error:", error)
      toast.error("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-small.svg"
              alt="Monex"
              className="w-14 h-14 cursor-pointer"
              onClick={handleSecretAdminAccess}
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monex</h1>
              <p className="text-amber-400/70 text-sm">Gestão Financeira</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Controle total das suas finanças
            </h2>
            <p className="text-amber-100/80 text-lg">
              Organize, analise e potencialize sua vida financeira com inteligência artificial.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { title: "Dashboard Inteligente", desc: "Visualize seus gastos em tempo real" },
              { title: "Relatórios com IA", desc: "Insights personalizados para você" },
              { title: "Metas Financeiras", desc: "Acompanhe seus objetivos" },
              { title: "Integração Bancária", desc: "Sincronize suas contas automaticamente" },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{feature.title}</p>
                  <p className="text-amber-100/60 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-amber-100/60 text-sm">
          © 2024 Monex. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img
              src="/logo-small.svg"
              alt="Monex"
              className="w-12 h-12 cursor-pointer"
              onClick={handleSecretAdminAccess}
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monex</h1>
              <p className="text-amber-400/70 text-sm">Gestão Financeira</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {activeTab === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login" 
                  ? "Entre com suas credenciais para acessar" 
                  : "Comece sua jornada financeira hoje"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Checkbox id="remember" />
                        <Label htmlFor="remember" className="font-normal cursor-pointer">Lembrar-me</Label>
                      </div>
                      <button 
                        type="button" 
                        className="text-amber-500 hover:underline"
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Entrar
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome completo"
                          className="pl-10"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          className="pl-10 pr-10"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="terms" 
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                        Concordo com os <button type="button" className="text-amber-500 hover:underline">Termos de Uso</button> e <button type="button" className="text-amber-500 hover:underline">Política de Privacidade</button>
                      </Label>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                      disabled={isLoading || !formData.acceptTerms}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Criar Conta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Login Admin */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
      
      {/* Modal de Esqueceu a Senha */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  )
}
