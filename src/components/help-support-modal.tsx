"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  Send,
  Clock,
  CheckCircle,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface HelpSupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const supportEmail = "suportmonetra@outlook.com"

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !subject || !message) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsSending(true)
    
    // Simular envio (em produção, você pode usar uma API de email)
    // Por enquanto, vamos abrir o cliente de email do usuário
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(`[Monetra] ${subject}`)}&body=${encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`)}`
    
    setTimeout(() => {
      window.location.href = mailtoLink
      setIsSending(false)
      setSent(true)
      toast.success("Abrindo seu cliente de email...")
      
      // Reset após 2 segundos
      setTimeout(() => {
        setSent(false)
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
        onClose()
      }, 2000)
    }, 500)
  }

  const handleClose = () => {
    setName("")
    setEmail("")
    setSubject("")
    setMessage("")
    setSent(false)
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg px-4"
          >
            <Card className="border-0 shadow-2xl">
              <CardHeader className="relative border-b">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Ajuda e Suporte</CardTitle>
                    <CardDescription>Entre em contato conosco</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Mensagem Preparada!</h3>
                    <p className="text-muted-foreground text-center mt-2">
                      Seu cliente de email foi aberto para enviar a mensagem.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Info de Contato */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30">
                      <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Mail className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Email de Suporte</p>
                        <a 
                          href={`mailto:${supportEmail}`}
                          className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                        >
                          {supportEmail}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Horário de Atendimento */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Horário de atendimento: Seg-Sex, 9h às 18h (Horário de Brasília)</span>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSendEmail} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input
                          id="subject"
                          placeholder="Ex: Problema com login"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea
                          id="message"
                          placeholder="Descreva sua dúvida ou problema..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={handleClose}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                          disabled={isSending}
                        >
                          {isSending ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                              </motion.div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Mensagem
                            </>
                          )}
                        </Button>
                      </div>
                    </form>

                    {/* Alternativa */}
                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                      <p>Ou envie um email diretamente para:</p>
                      <a 
                        href={`mailto:${supportEmail}`}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        {supportEmail}
                      </a>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
