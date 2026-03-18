"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  Crown, 
  Check, 
  Sparkles,
  Clock,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TrialExpiredModalProps {
  isOpen: boolean
  onUpgrade: () => void
  onContinueFree?: () => void
}

const plans = [
  {
    id: "PRO",
    name: "Premium",
    price: 19.90,
    features: [
      "Tudo do Gratuito +",
      "Relatórios IA ilimitados",
      "Integração bancária (em breve)",
      "Suporte VIP",
      "Sem anúncios",
    ],
    popular: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 49.90,
    features: [
      "Tudo do Premium +",
      "Modo Família completo",
      "Metas em conjunto",
      "Até 5 membros",
      "API de integração (em breve)",
      "Suporte dedicado 24/7",
    ],
    badge: "Família",
  },
]

export function TrialExpiredModal({ isOpen, onUpgrade, onContinueFree }: TrialExpiredModalProps) {
  const handleSelectPlan = (planId: string) => {
    onUpgrade()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden my-8">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 p-6 md:p-8 text-white">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-white/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">
                      Período de Teste Encerrado
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Seu período de 14 dias grátis acabou!
                  </h2>
                  <p className="text-white/90 text-lg">
                    Escolha um plano para continuar usando o Monex com todos os recursos.
                  </p>
                </div>
              </div>

              {/* Plans */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`relative border-2 transition-all cursor-pointer hover:shadow-lg ${
                        plan.popular 
                          ? "border-amber-500 ring-2 ring-amber-500/20" 
                          : "border-border hover:border-amber-500/50"
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-amber-500 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Mais Popular
                          </Badge>
                        </div>
                      )}
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-purple-500 text-white">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className={plan.popular || plan.badge ? "pt-8" : ""}>
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-amber-500" />
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                        </div>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-bold">
                            R$ {plan.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <Button 
                          className={`w-full mt-4 ${
                            plan.popular 
                              ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" 
                              : "bg-primary"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectPlan(plan.id)
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Assinar Agora
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Info */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">
                    💳 Pagamento seguro via Google Play • Cancele quando quiser • Suporte 24/7
                  </p>
                </div>

                {/* Continue with limited */}
                {onContinueFree && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={onContinueFree}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      Continuar com recursos limitados
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
