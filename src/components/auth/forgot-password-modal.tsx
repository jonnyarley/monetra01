"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Loader2, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao solicitar redefinição")
        return
      }

      setIsSuccess(true)
      toast.success("Se o email existir, você receberá instruções para redefinir sua senha.")

      // In development, show the reset link
      if (data.devResetUrl) {
        console.log("=".repeat(60))
        console.log("DEV MODE - Reset URL:", data.devResetUrl)
        console.log("=".repeat(60))
      }

    } catch (error) {
      console.error("Forgot password error:", error)
      toast.error("Erro ao solicitar redefinição")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setIsSuccess(false)
    onClose()
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md px-4"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="relative">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <CardTitle className="text-center">
                  {isSuccess ? "Email Enviado!" : "Esqueceu a Senha?"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                  >
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-muted-foreground">
                      Se o email <strong>{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.
                    </p>
                    <Button
                      onClick={handleClose}
                      className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                    >
                      Entendi
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Digite seu email e enviaremos um link para redefinir sua senha.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Enviar Link
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
