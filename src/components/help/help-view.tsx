"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  HelpCircle, 
  Mail, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  MapPin
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"

export function HelpView() {
  const { user } = useAppStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
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
    
    // Abrir cliente de email do usuário com os dados preenchidos
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(`[Monetra] ${subject}`)}&body=${encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`)}`
    
    setTimeout(() => {
      window.location.href = mailtoLink
      setIsSending(false)
      setSent(true)
      toast.success("Abrindo seu cliente de email...")
      
      // Limpar formulário após envio
      setTimeout(() => {
        setSubject("")
        setMessage("")
        setSent(false)
      }, 2000)
    }, 500)
  }

  const faqItems = [
    {
      question: "Como adiciono uma nova transação?",
      answer: "Vá na aba 'Transações' e clique no botão '+' no canto inferior direito. Preencha os dados e salve."
    },
    {
      question: "Como altero meu plano?",
      answer: "Acesse 'Configurações' > 'Assinatura' e escolha o plano que melhor atende suas necessidades."
    },
    {
      question: "Como defino uma meta financeira?",
      answer: "Na aba 'Metas', clique em 'Nova Meta'. Defina o valor objetivo e o prazo desejado."
    },
    {
      question: "Minhas informações estão seguras?",
      answer: "Sim! Utilizamos criptografia de ponta e seguimos todas as normas de segurança para proteger seus dados."
    }
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold flex items-center gap-3"
        >
          <HelpCircle className="h-8 w-8 text-amber-500" />
          Central de Ajuda
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-2"
        >
          Tire suas dúvidas ou entre em contato conosco
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Contato */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-500" />
                Entre em Contato
              </CardTitle>
              <CardDescription>
                Preencha o formulário abaixo para enviar sua mensagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Mensagem Preparada!</h3>
                  <p className="text-muted-foreground text-center mt-2 max-w-md">
                    Seu cliente de email foi aberto. Complete o envio da mensagem.
                  </p>
                  <Button 
                    className="mt-6"
                    onClick={() => setSent(false)}
                  >
                    Enviar outra mensagem
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="Ex: Problema com login, Dúvida sobre plano..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva sua dúvida, problema ou sugestão..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
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
                          Abrindo email...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Ao clicar em enviar, seu cliente de email será aberto para completar o envio
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar - Informações */}
        <div className="space-y-6">
          {/* Informações de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30">
              <CardHeader>
                <CardTitle className="text-lg">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Mail className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${supportEmail}`}
                      className="font-medium text-amber-600 hover:text-amber-700"
                    >
                      {supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">Seg-Sex, 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">Brasil (Horário de Brasília)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Perguntas Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <p className="font-medium text-sm">{item.question}</p>
                    <p className="text-xs text-muted-foreground">{item.answer}</p>
                    {index < faqItems.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
