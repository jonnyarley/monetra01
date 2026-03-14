"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Wallet,
  Target,
  PiggyBank,
  Sparkles,
  Bell,
  Trophy,
  ArrowRight,
  Calendar,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Monetra! 🎉",
    description: "Seu novo assistente financeiro pessoal. Vamos fazer um tour rápido para você conhecer as principais funcionalidades.",
    icon: <Sparkles className="h-12 w-12" />,
    color: "from-amber-500 to-orange-600"
  },
  {
    id: "accounts",
    title: "Contas e Cartões",
    description: "Cadastre suas contas bancárias e cartões de crédito para ter uma visão completa do seu patrimônio.",
    icon: <Wallet className="h-12 w-12" />,
    color: "from-blue-500 to-cyan-600"
  },
  {
    id: "transactions",
    title: "Controle suas Transações",
    description: "Registre suas receitas e despesas. Use nossa IA para categorizar automaticamente ou importe de extratos bancários.",
    icon: <ArrowRight className="h-12 w-12" />,
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "calendar",
    title: "Calendário Financeiro",
    description: "Visualize todas as suas transações em um calendário interativo. Nunca mais esqueça de uma conta a pagar!",
    icon: <Calendar className="h-12 w-12" />,
    color: "from-teal-500 to-cyan-600"
  },
  {
    id: "goals",
    title: "Defina Metas Financeiras",
    description: "Crie metas de economia e acompanhe seu progresso. Quero comprar uma casa? Fazer uma viagem? O Monetra te ajuda!",
    icon: <Target className="h-12 w-12" />,
    color: "from-purple-500 to-pink-600"
  },
  {
    id: "budgets",
    title: "Orçamentos Inteligentes",
    description: "Defina limites de gastos por categoria e receba alertas quando estiver perto de estourar o orçamento.",
    icon: <PiggyBank className="h-12 w-12" />,
    color: "from-rose-500 to-red-600"
  },
  {
    id: "recurring",
    title: "Transações Recorrentes",
    description: "Cadastre suas contas fixas como aluguel, Netflix, academia. O sistema lança automaticamente todo mês!",
    icon: <Bell className="h-12 w-12" />,
    color: "from-indigo-500 to-violet-600"
  },
  {
    id: "monscore",
    title: "Mone Score",
    description: "Acompanhe sua pontuação financeira, conquiste insígnias e evolua seu nível. Complete desafios e ganhe recompensas!",
    icon: <Trophy className="h-12 w-12" />,
    color: "from-yellow-500 to-amber-600"
  }
]

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  
  const progress = ((currentStep + 1) / steps.length) * 100
  const step = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, step.id])
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedSteps: [...completedSteps, step.id],
          completed: true
        })
      })
    } catch (error) {
      console.error("Error saving onboarding progress:", error)
    }
    
    toast.success("Configuração concluída! Bem-vindo ao Monetra! 🎉")
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative">
            <div className={`h-32 bg-gradient-to-br ${step.color} flex items-center justify-center`}>
              <motion.div
                key={step.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="text-white"
              >
                {step.icon}
              </motion.div>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/20">
              <Progress value={progress} className="h-1 rounded-none" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* Step indicator */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/20">
              <span className="text-xs font-medium text-white">
                {currentStep + 1} de {steps.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>

            {/* Step dots */}
            <div className="flex justify-center gap-2">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep 
                      ? "w-6 bg-amber-500" 
                      : completedSteps.includes(s.id)
                        ? "bg-emerald-500"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Começar a Usar
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Skip button */}
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Pular tutorial
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
