"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  Lightbulb, 
  Bell, 
  RefreshCw, 
  Plus, 
  Target,
  Wallet,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Search,
  BarChart3,
  PieChart
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  action?: string
  success?: boolean
  timestamp: Date
}

const quickActions = [
  { icon: Target, label: "Criar meta", prompt: "Criar meta de " },
  { icon: Bell, label: "Criar lembrete", prompt: "Criar lembrete para " },
  { icon: RefreshCw, label: "Gasto recorrente", prompt: "Criar gasto recorrente de " },
  { icon: Plus, label: "Adicionar receita", prompt: "Recebi " },
  { icon: Wallet, label: "Ver saldo", prompt: "Qual é meu saldo atual?" },
  { icon: BarChart3, label: "Resumo financeiro", prompt: "Me dê um resumo das minhas finanças" },
  { icon: Search, label: "Buscar gastos", prompt: "Quais foram meus maiores gastos este mês?" },
  { icon: PieChart, label: "Análise categorias", prompt: "O que estou gastando mais?" },
]

const suggestions = [
  "Quanto gastei com alimentação este mês?",
  "Crie um lembrete recorrente para aluguel 400 reais dia 15",
  "Quais contas vencem esta semana?",
  "Como estão minhas metas?",
  "Transfira 200 reais para poupança",
  "Me dê dicas para economizar dinheiro",
]

export function TeraAssistantView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAppStore()

  // Mensagem inicial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Olá${user?.name ? ` ${user.name.split(" ")[0]}` : ""}! 👋 Sou a **Tera**, sua assistente financeira inteligente do Monetra.

**Posso ajudá-lo com:**

🎯 **Metas Financeiras**
• Criar, editar e acompanhar metas
• "Criar meta de 5000 reais para viagem"

🔔 **Lembretes e Contas**
• Criar lembretes de contas a pagar
• Ver contas que vencem esta semana

🔄 **Gastos Recorrentes**
• Configurar assinaturas e despesas fixas
• Ver todos os seus gastos mensais

💰 **Receitas e Despesas**
• Adicionar transações rapidamente
• Buscar e filtrar gastos

📊 **Análises e Relatórios**
• Ver resumo financeiro
• Comparar gastos por período
• Identificar onde você gasta mais

💡 **Dicas Personalizadas**
• Sugestões de economia
• Alertas de gastos excessivos

**Como posso ajudar você hoje?**`,
          timestamp: new Date()
        }
      ])
    }
  }, [user?.name, messages.length])

  // Scroll para o final quando nova mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Desculpe, não consegui processar sua mensagem.",
        action: data.action,
        success: data.success,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Desculpe, tive um problema para processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Tera IA
              <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">Assistente</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Sua assistente financeira inteligente
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action.prompt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-all whitespace-nowrap flex-shrink-0"
          >
            <action.icon className="h-4 w-4 text-amber-500" />
            <span className="text-sm">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background/50 p-4 mb-4 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex mb-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                  message.role === "user"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-br-md"
                    : "bg-muted border border-border rounded-bl-md"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Tera IA</span>
                    {message.action && message.action !== "general_chat" && (
                      <span className="flex items-center gap-1 text-xs">
                        {message.success ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </p>
                <p className={cn(
                  "text-[10px] mt-2",
                  message.role === "user" ? "text-white/70" : "text-muted-foreground"
                )}>
                  {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <span className="text-sm text-muted-foreground">Analisando...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Sugestões</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-all text-sm text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-xl border border-border p-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem ou peça ajuda..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:shadow-lg hover:shadow-amber-500/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {/* Help Button */}
      <button
        onClick={() => sendMessage("O que você pode fazer?")}
        className="flex items-center gap-2 justify-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
        <span>O que a Tera pode fazer?</span>
      </button>
    </div>
  )
}
