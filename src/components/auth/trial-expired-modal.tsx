"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Crown, Zap, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { formatPrice, PLANS_ARRAY } from "@/lib/plans"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TrialExpiredModalProps {
  isOpen: boolean
}

export function TrialExpiredModal({ isOpen }: TrialExpiredModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "BUSINESS">("PRO")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setAuthenticated } = useAppStore()
  const router = useRouter()

  const paidPlans = PLANS_ARRAY.filter(p => p.monthlyPrice > 0)

  const handleUpgrade = async () => {
    setIsLoading(true)

    try {
      // Simular upgrade (em produção, integrar com Stripe/Google Play)
      const response = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan })
      })

      if (response.ok) {
        toast.success(`Plano ${selectedPlan === "PRO" ? "Premium" : "Business"} ativado com sucesso!`)
        // Atualizar o usuário no store
        const meResponse = await fetch("/api/auth/me")
        const meData = await meResponse.json()
        if (meData.user) {
          setUser(meData.user)
        }
      } else {
        // Simular sucesso para demo
        toast.success(`Plano ${selectedPlan === "PRO" ? "Premium" : "Business"} selecionado!`)
      }
    } catch (error) {
      console.error("Upgrade error:", error)
      toast.error("Erro ao processar upgrade. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setAuthenticated(false)
      toast.info("Você saiu da sua conta")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-500 to-yellow-600 p-6 text-center">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Seu período de teste expirou!
              </h2>
              <p className="text-white/90">
                Escolha um plano para continuar usando o Monex
              </p>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {paidPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/20"
                      : "hover:border-amber-500/50"
                  }`}
                  onClick={() => setSelectedPlan(plan.id as "PRO" | "BUSINESS")}
                >
                  {plan.badge && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full text-xs font-medium text-white">
                      {plan.badge}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {plan.id === "PRO" ? (
                        <Zap className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Crown className="w-5 h-5 text-amber-500" />
                      )}
                      <h3 className="font-semibold">{plan.name}</h3>
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-bold">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedPlan === plan.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 h-12 text-lg"
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Fazer Upgrade - {selectedPlan === "PRO" ? formatPrice(19.90) : formatPrice(49.90)}/mês
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleLogout}
              >
                Sair da conta
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>✓ Cancele quando quiser</span>
              <span>✓ Suporte 24/7</span>
              <span>✓ Garantia de 7 dias</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
