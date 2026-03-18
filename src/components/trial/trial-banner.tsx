"use client"

import { motion } from "framer-motion"
import { Clock, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrialBannerProps {
  daysLeft: number
  onUpgrade: () => void
}

export function TrialBanner({ daysLeft, onUpgrade }: TrialBannerProps) {
  if (daysLeft <= 0) return null

  const isUrgent = daysLeft <= 3
  const isWarning = daysLeft <= 7 && daysLeft > 3

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        w-full px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3
        ${isUrgent 
          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" 
          : isWarning 
            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
            : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-full 
          ${isUrgent ? "bg-white/20 animate-pulse" : "bg-white/20"}
        `}>
          <Clock className="h-5 w-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-semibold">
            {isUrgent 
              ? `⚠️ Últimos ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} do seu período grátis!`
              : `🎉 Você tem ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} grátis restantes`
            }
          </p>
          <p className="text-sm text-white/80">
            Assine agora e mantenha acesso a todos os recursos
          </p>
        </div>
      </div>
      
      <Button
        onClick={onUpgrade}
        className={`
          bg-white text-gray-900 hover:bg-gray-100
          ${isUrgent ? "animate-bounce" : ""}
        `}
      >
        <Crown className="h-4 w-4 mr-2" />
        Fazer Upgrade
      </Button>
    </motion.div>
  )
}
