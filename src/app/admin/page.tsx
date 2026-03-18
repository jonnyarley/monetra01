"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useAppStore } from "@/lib/store"

// Lista de emails autorizados a acessar o admin
const ADMIN_EMAILS = [
  "jonnyarley379@gmail.com",
]

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, isAdmin } = useAppStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Primeiro, verificar se temos o cookie admin_token
      try {
        const response = await fetch("/api/admin/verify/")
        const data = await response.json()
        
        if (data.authenticated) {
          setIsAuthorized(true)
          setIsChecking(false)
          return
        }
      } catch (error) {
        console.log("Admin verify error:", error)
      }

      // Se não tem cookie admin, verificar estado local
      if (!isAuthenticated) {
        router.push("/")
        return
      }

      // Verificar se é admin pelo estado ou email
      const userEmail = user?.email?.toLowerCase()
      const emailAuthorized = ADMIN_EMAILS.some(
        email => email.toLowerCase() === userEmail
      )
      const roleIsAdmin = user?.role === "admin" || isAdmin

      setIsAuthorized(emailAuthorized || roleIsAdmin)
      setIsChecking(false)
    }

    checkAuth()
  }, [isAuthenticated, user, isAdmin, router])

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Não autorizado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-6">
                Você não tem permissão para acessar esta área.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Se você é um administrador, faça login através do painel de admin.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Autorizado - mostrar admin dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo-small.svg" alt="Monetra" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-bold text-white">Monetra Admin</h1>
              <p className="text-xs text-amber-400">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Admin</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await fetch("/api/admin/logout/", { method: "POST" })
                router.push("/")
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <AdminDashboard />
    </div>
  )
}
