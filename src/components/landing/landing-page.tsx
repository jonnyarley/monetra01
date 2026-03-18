"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Star,
  Users,
  LineChart,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Download,
  Lock,
  Shield,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthForm } from "@/components/auth/auth-form"

// Animated counter component
function AnimatedCounter({ end, prefix = "", suffix = "", duration = 2 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{prefix}{count.toLocaleString('pt-BR')}{suffix}</span>
}

// Features data
const features = [
  {
    icon: Bot,
    title: "Tera IA - Seu Assistente Financeiro",
    description: "Inteligência artificial que entende suas finanças e dá conselhos personalizados. Pergunte qualquer coisa sobre seu dinheiro.",
    highlight: true
  },
  {
    icon: LineChart,
    title: "Mone Score",
    description: "Seu score financeiro pessoal. Saiba exatamente como está sua saúde financeira e como melhorar."
  },
  {
    icon: Target,
    title: "Metas Inteligentes",
    description: "Crie metas financeiras e acompanhe seu progresso com visualizações motivadoras."
  },
  {
    icon: Calendar,
    title: "Calendário Financeiro",
    description: "Visualize todas as suas transações em um calendário intuitivo. Nunca mais esqueça uma conta."
  },
  {
    icon: TrendingUp,
    title: "Relatórios com IA",
    description: "Análises profundas dos seus gastos com insights gerados por inteligência artificial."
  },
  {
    icon: Wallet,
    title: "Contas e Cartões",
    description: "Organize todas as suas contas bancárias e cartões em um só lugar."
  },
  {
    icon: Users,
    title: "Modo Família",
    description: "Gerencie finanças em família. Metas compartilhadas e controle total.",
    badge: "Business"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados criptografados e protegidos. Sua privacidade é nossa prioridade."
  }
]

// Plans data
const plans = [
  {
    id: "free",
    name: "Teste Grátis",
    price: 0,
    period: "14 dias grátis",
    description: "Experimente todo o poder do Monex sem pagar nada",
    features: [
      "Todas as funcionalidades liberadas",
      "Tera IA assistente",
      "Relatórios IA (5/mês)",
      "Mone Score completo",
      "Metas ilimitadas",
      "Suporte por email"
    ],
    cta: "Começar Grátis",
    popular: false
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.90,
    period: "/mês",
    description: "Para quem quer levar as finanças a sério",
    features: [
      "Tudo do Teste Grátis +",
      "Relatórios IA ilimitados",
      "Integração bancária*",
      "Suporte VIP prioritário",
      "Sem anúncios",
      "Exportação avançada"
    ],
    cta: "Assinar Premium",
    popular: true
  },
  {
    id: "business",
    name: "Business",
    price: 49.90,
    period: "/mês",
    description: "Controle financeiro para toda a família",
    features: [
      "Tudo do Premium +",
      "Modo Família completo",
      "Até 5 membros",
      "Metas em conjunto",
      "Suporte dedicado 24/7",
      "API de integração*"
    ],
    cta: "Assinar Business",
    popular: false
  }
]

// Testimonials removed - not needed

// Stats
const stats = [
  { value: 10000, suffix: "+", label: "Usuários ativos" },
  { value: 5, suffix: "M+", label: "Transações gerenciadas" },
  { value: 98, suffix: "%", label: "Satisfação" },
  { value: 4.9, suffix: "/5", label: "Avaliação média" }
]

// FAQ
const faqs = [
  {
    question: "Como funciona o teste grátis de 14 dias?",
    answer: "Você tem acesso completo a todas as funcionalidades do Monex por 14 dias, sem precisar cadastrar cartão. Ao final, escolha o plano que melhor se encaixa na sua necessidade."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar sua assinatura a qualquer momento diretamente no app. Sem taxas, sem burocracia."
  },
  {
    question: "O que é a Tera IA?",
    answer: "A Tera IA é sua assistente financeira pessoal. Ela analisa seus gastos, responde perguntas sobre suas finanças e dá dicas personalizadas para você economizar."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Usamos criptografia de ponta e seguimos todas as normas de segurança. Seus dados nunca são compartilhados."
  },
  {
    question: "O Modo Família funciona como?",
    answer: "No plano Business, você pode adicionar até 5 membros da família. Todos podem ver as finanças compartilhadas, criar metas juntos e acompanhar o progresso em tempo real."
  }
]

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("register")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  if (showAuth) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowAuth(false)}
          className="absolute top-4 left-4 z-50"
        >
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Voltar
        </Button>
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                <img src="/logo-small.svg" alt="Monex" className="w-7 h-7" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                Monex
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>

              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setAuthMode("login")
                  setShowAuth(true)
                }}
              >
                Entrar
              </Button>
              <Button
                onClick={() => {
                  setAuthMode("register")
                  setShowAuth(true)
                }}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                14 dias grátis para experimentar
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Suas finanças,{" "}
                <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                  finalmente organizadas
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl">
                Controle total do seu dinheiro com inteligência artificial. 
                O Monex organiza, analisa e te ajuda a tomar as melhores decisões financeiras.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode("register")
                    setShowAuth(true)
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-lg px-8"
                >
                  Começar Agora - Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancele quando quiser
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Dados seguros
                </div>
              </div>
            </motion.div>

            {/* Hero Image/App Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                {/* App Preview Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-1 border border-amber-500/20">
                  <div className="bg-slate-900 rounded-xl p-4">
                    {/* Mock Dashboard */}
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Saldo Total</p>
                          <p className="text-2xl font-bold text-white">R$ 24.580,00</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-amber-500" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <p className="text-xs text-green-400">Receitas</p>
                          <p className="text-lg font-semibold text-green-400">R$ 8.450</p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-3">
                          <p className="text-xs text-red-400">Despesas</p>
                          <p className="text-lg font-semibold text-red-400">R$ 3.280</p>
                        </div>
                      </div>
                      
                      {/* Chart Mock */}
                      <div className="h-32 bg-slate-800/50 rounded-lg flex items-end justify-around p-3 gap-2">
                        {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-amber-500 to-yellow-500 rounded-t"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      
                      {/* Mone Score */}
                      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg p-3 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-amber-400">Mone Score</p>
                            <p className="text-xl font-bold text-white">850</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-400">+15 este mês</p>
                            <p className="text-xs text-slate-400">Excelente</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Chat Preview */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <div className="text-xs text-slate-300">
                            <span className="text-amber-400 font-medium">Tera IA:</span> Você economizou R$ 450 este mês! Continue assim e vai atingir sua meta de viagem. 🎉
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Recursos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa em um só app
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para você controlar suas finanças, 
              com a ajuda da inteligência artificial.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full ${feature.highlight ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-amber-500" />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {feature.title}
                      {feature.badge && (
                        <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Como Funciona</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comece em menos de 2 minutos
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Crie sua conta grátis", description: "Cadastro rápido em segundos. Sem cartão de crédito.", icon: Lock },
              { step: 2, title: "Adicione suas finanças", description: "Importe de planilhas ou adicione manualmente.", icon: Download },
              { step: 3, title: "Domine seu dinheiro", description: "IA te ajuda a entender e melhorar suas finanças.", icon: TrendingUp }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Planos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade. Sem surpresas, sem taxas escondidas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-amber-500 shadow-lg shadow-amber-500/10' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => {
                        setAuthMode("register")
                        setShowAuth(true)
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            * Recursos em breve. Cancele a qualquer momento. 100% de garantia de 7 dias.
          </p>
        </div>
      </section>



      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="pt-0">
                          <p className="text-muted-foreground text-sm">{faq.answer}</p>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 border border-amber-500/20 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Pronto para transformar suas finanças?
                </h2>
                <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                  Comece agora mesmo com 14 dias grátis. Sem cartão, sem compromisso.
                </p>
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode("register")
                    setShowAuth(true)
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-lg px-12"
                >
                  Começar Agora - É Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-slate-400 mt-4">
                  ✓ 14 dias grátis &nbsp; ✓ Sem cartão &nbsp; ✓ Cancele quando quiser
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                  <img src="/logo-small.svg" alt="Monex" className="w-5 h-5" />
                </div>
                <span className="font-bold">Monex</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Organize suas finanças com inteligência artificial.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Preços</a></li>
                <li><a href="#" className="hover:text-foreground">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Monex. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
