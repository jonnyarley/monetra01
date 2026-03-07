"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Trophy,
  Star,
  Target,
  PiggyBank,
  TrendingUp,
  Wallet,
  CreditCard,
  Calendar,
  Award,
  Crown,
  Zap,
  Shield,
  Flame,
  Diamond,
  Medal,
  Sparkles,
  Lock,
  Check,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Receipt,
  ListTodo,
  Banknote,
  Gem,
  Tags,
  FolderKanban,
  Repeat,
  RefreshCw,
  Layers,
  Flag,
  Rocket,
  Lightbulb,
  Building,
  Building2,
  CheckCircle,
  CircleDollarSign,
  Coins,
  Percent,
  Briefcase,
  CalendarCheck,
  PieChart,
  BarChart,
  Calculator,
  LayoutGrid,
  Network,
  ShieldCheck,
  TrendingDown,
  BadgePercent,
  Grid3X3,
  CalendarDays,
  Landmark,
  WalletCards,
  BadgeCheck,
  ShoppingCart,
  Gauge,
  CalendarRange,
  MapPin,
  FileText,
  BarChart3,
  LineChart,
  Brain,
  Bird,
  FlaskConical,
  Cake,
  Moon,
  Sun,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

// Types
interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
  points: number
  earned: boolean
  earnedAt?: Date
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface Level {
  name: string
  minScore: number
  maxScore: number
}

interface MonScoreData {
  score: number
  totalPoints: number
  level: number
  levelName: string
  nextLevel: string | null
  levelProgress: number
  badges: BadgeData[]
  earnedBadgesCount: number
  totalBadges: number
  stats: {
    completedGoals: number
    transactionCount: number
    totalSavings: number
    streakDays: number
  }
}

// Constants
const LEVELS: Level[] = [
  { name: "Iniciante", minScore: 0, maxScore: 100 },
  { name: "Aprendiz", minScore: 101, maxScore: 250 },
  { name: "Intermediário", minScore: 251, maxScore: 500 },
  { name: "Avançado", minScore: 501, maxScore: 750 },
  { name: "Expert", minScore: 751, maxScore: 900 },
  { name: "Mestre", minScore: 901, maxScore: 1000 },
]

// Category names
const categoryNames: Record<string, string> = {
  transactions: "Transações",
  goals: "Metas",
  savings: "Economia",
  budgets: "Orçamentos",
  accounts: "Contas",
  cards: "Cartões",
  streaks: "Sequências",
  calendar: "Calendário",
  reports: "Relatórios",
  special: "Especiais"
}

// Icon map - todos os ícones usados nas 100 insígnias
const iconMap: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard className="h-5 w-5" />,
  Receipt: <Receipt className="h-5 w-5" />,
  ListTodo: <ListTodo className="h-5 w-5" />,
  Calendar: <Calendar className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
  ArrowUpRight: <ArrowUpRight className="h-5 w-5" />,
  ArrowDownRight: <ArrowDownRight className="h-5 w-5" />,
  Wallet: <Wallet className="h-5 w-5" />,
  Banknote: <Banknote className="h-5 w-5" />,
  Gem: <Gem className="h-5 w-5" />,
  Diamond: <Diamond className="h-5 w-5" />,
  Tags: <Tags className="h-5 w-5" />,
  FolderKanban: <FolderKanban className="h-5 w-5" />,
  ArrowLeftRight: <ArrowLeftRight className="h-5 w-5" />,
  Repeat: <Repeat className="h-5 w-5" />,
  RefreshCw: <RefreshCw className="h-5 w-5" />,
  Layers: <Layers className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Flag: <Flag className="h-5 w-5" />,
  Rocket: <Rocket className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  Building: <Building className="h-5 w-5" />,
  Medal: <Medal className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  CircleDollarSign: <CircleDollarSign className="h-5 w-5" />,
  Coins: <Coins className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Percent: <Percent className="h-5 w-5" />,
  PiggyBank: <PiggyBank className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  CalendarCheck: <CalendarCheck className="h-5 w-5" />,
  PieChart: <PieChart className="h-5 w-5" />,
  BarChart: <BarChart className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  LayoutGrid: <LayoutGrid className="h-5 w-5" />,
  Network: <Network className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  TrendingDown: <TrendingDown className="h-5 w-5" />,
  BadgePercent: <BadgePercent className="h-5 w-5" />,
  Grid3X3: <Grid3X3 className="h-5 w-5" />,
  CalendarDays: <CalendarDays className="h-5 w-5" />,
  Landmark: <Landmark className="h-5 w-5" />,
  WalletCards: <WalletCards className="h-5 w-5" />,
  BadgeCheck: <BadgeCheck className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  Gauge: <Gauge className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  CalendarRange: <CalendarRange className="h-5 w-5" />,
  MapPin: <MapPin className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  LineChart: <LineChart className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Bird: <Bird className="h-5 w-5" />,
  FlaskConical: <FlaskConical className="h-5 w-5" />,
  Cake: <Cake className="h-5 w-5" />,
  Moon: <Moon className="h-5 w-5" />,
  Sun: <Sun className="h-5 w-5" />,
}

// Level icon component
function LevelIcon({ levelIndex }: { levelIndex: number }) {
  const icons = [
    <TrendingUp className="h-5 w-5" key="0" />,
    <TrendingUp className="h-5 w-5" key="1" />,
    <TrendingUp className="h-5 w-5" key="2" />,
    <Award className="h-5 w-5" key="3" />,
    <Crown className="h-5 w-5" key="4" />,
    <Diamond className="h-5 w-5" key="5" />,
  ]
  return icons[levelIndex] || icons[0]
}

// Level color map
const levelColors = [
  "text-slate-500",
  "text-emerald-500",
  "text-blue-500",
  "text-purple-500",
  "text-amber-500",
  "text-rose-500",
]

// Circular Progress Component
function CircularProgress({ value, size = 160, strokeWidth = 10, children }: { 
  value: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#scoreGradient)" strokeWidth={strokeWidth}
          strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }} style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// Badge Card Component
function BadgeCard({ badge, onClick }: { badge: BadgeData; onClick: () => void }) {
  const rarityBorders = {
    common: "border-slate-300 dark:border-slate-600",
    rare: "border-blue-400 dark:border-blue-500",
    epic: "border-purple-400 dark:border-purple-500",
    legendary: "border-amber-400 dark:border-amber-500 animate-pulse",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-xl border-2 cursor-pointer transition-all",
        badge.earned ? `${badge.bgColor} ${rarityBorders[badge.rarity]}` : "bg-muted/50 border-muted opacity-50"
      )}
    >
      {!badge.earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn("p-2 rounded-full", badge.bgColor, badge.color)}>
          {iconMap[badge.icon] || <Award className="h-5 w-5" />}
        </div>
        <h3 className="font-semibold text-xs line-clamp-1">{badge.name}</h3>
        <Badge variant="secondary" className="text-[10px]">+{badge.points} pts</Badge>
      </div>
    </motion.div>
  )
}

// Level Badge Component
function LevelBadge({ level, current, index }: { level: Level; current: boolean; index: number }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2.5 rounded-xl transition-all",
      current ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30" : "bg-muted/50"
    )}>
      <div className={cn("p-1.5 rounded-lg bg-muted", levelColors[index])}>
        <LevelIcon levelIndex={index} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", current && levelColors[index])}>{level.name}</p>
        <p className="text-[10px] text-muted-foreground">{level.minScore} - {level.maxScore}</p>
      </div>
      {current && <Check className="h-4 w-4 text-amber-500" />}
    </div>
  )
}

export function MonScoreView() {
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)
  const [data, setData] = useState<MonScoreData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/monscore/")
        if (!response.ok) throw new Error("Erro ao carregar dados")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching monscore:", error)
        toast.error("Erro ao carregar Mone Score")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando Mone Score...</p>
        </div>
      </div>
    )
  }

  const score = data?.score || 0
  const totalPoints = data?.totalPoints || 0
  const currentLevelIndex = LEVELS.findIndex(l => score >= l.minScore && score <= l.maxScore) || 0
  const currentLevel = LEVELS[currentLevelIndex]
  const nextLevel = LEVELS[currentLevelIndex + 1]
  const levelProgress = nextLevel ? ((score - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100 : 100

  const earnedBadges = data?.badges.filter(b => b.earned) || []
  const lockedBadges = data?.badges.filter(b => !b.earned) || []

  const badgesByCategory = data?.badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = []
    }
    acc[badge.category].push(badge)
    return acc
  }, {} as Record<string, BadgeData[]>) || {}

  const stats = data?.stats || {
    completedGoals: 0,
    transactionCount: 0,
    totalSavings: 0,
    streakDays: 0
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-2xl md:text-3xl font-bold flex items-center gap-2"
        >
          <Trophy className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
          Mone Score
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="text-sm md:text-base text-muted-foreground"
        >
          Sua pontuação financeira e conquistas
        </motion.p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="lg:col-span-1"
        >
          <Card className="border-0 shadow-lg h-full bg-gradient-to-br from-amber-950 to-slate-950">
            <CardContent className="p-4 md:p-6 flex flex-col items-center">
              <div className="relative mb-4">
                <CircularProgress value={(score / 1000) * 100} size={160} strokeWidth={10}>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                      {score}
                    </span>
                    <span className="text-[10px] text-muted-foreground">de 1.000</span>
                  </div>
                </CircularProgress>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("p-1.5 rounded-full bg-muted", levelColors[currentLevelIndex])}>
                  <LevelIcon levelIndex={currentLevelIndex} />
                </div>
                <div className="text-center">
                  <p className={cn("font-bold text-base", levelColors[currentLevelIndex])}>
                    {currentLevel?.name || "Iniciante"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Nível atual</p>
                </div>
              </div>
              {nextLevel && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{currentLevel?.name}</span>
                    <span>{nextLevel.name}</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                  <p className="text-[10px] text-center text-muted-foreground">
                    Faltam {nextLevel.minScore - score} pts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {[
            { icon: <Star className="h-4 w-4" />, iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-500", label: "Total Ganho", value: `${totalPoints} pts` },
            { icon: <Award className="h-4 w-4" />, iconBg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-500", label: "Insígnias", value: `${earnedBadges.length}/${data?.totalBadges || 0}` },
            { icon: <Target className="h-4 w-4" />, iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-500", label: "Metas", value: `${stats.completedGoals} concluídas` },
            { icon: <Flame className="h-4 w-4" />, iconBg: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-500", label: "Sequência", value: `${stats.streakDays} dias` },
            { icon: <PiggyBank className="h-4 w-4" />, iconBg: "bg-teal-100 dark:bg-teal-900/30", iconColor: "text-teal-500", label: "Economia", value: formatCurrency(stats.totalSavings) },
            { icon: <TrendingUp className="h-4 w-4" />, iconBg: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-500", label: "Transações", value: `${stats.transactionCount} total` },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 md:p-2 rounded-lg", stat.iconBg)}>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm md:text-base font-bold truncate">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Levels Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 md:p-6 pb-0">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Níveis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
              {LEVELS.map((level, index) => (
                <LevelBadge key={level.name} level={level} current={currentLevelIndex === index} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 md:p-6 pb-0">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Insígnias
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {earnedBadges.length} de {data?.totalBadges || 0} conquistas desbloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs px-3">
                  Todas ({data?.totalBadges || 0})
                </TabsTrigger>
                <TabsTrigger value="earned" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs px-3">
                  Conquistadas ({earnedBadges.length})
                </TabsTrigger>
                <TabsTrigger value="locked" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs px-3">
                  Bloqueadas ({lockedBadges.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {Object.entries(badgesByCategory).map(([category, badges]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      {categoryNames[category] || category}
                      <Badge variant="secondary" className="text-[10px]">
                        {badges.filter(b => b.earned).length}/{badges.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {badges.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="earned">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {earnedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="locked">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {lockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 md:p-6 pb-0">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {earnedBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conquista ainda. Comece a usar o app!</p>
              </div>
            ) : (
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {earnedBadges
                    .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 1))
                    .slice(0, 8)
                    .map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className={cn("p-1.5 rounded-full", badge.bgColor, badge.color)}>
                          {iconMap[badge.icon] || <Award className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{badge.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {badge.earnedAt?.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">+{badge.points} pts</Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Badge Detail Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-full", selectedBadge.bgColor, selectedBadge.color)}>
                    {iconMap[selectedBadge.icon] || <Award className="h-5 w-5" />}
                  </div>
                  {selectedBadge.name}
                </DialogTitle>
                <DialogDescription>{selectedBadge.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pontos</span>
                  <Badge className={selectedBadge.color}>+{selectedBadge.points} pts</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria</span>
                  <span className="font-medium capitalize">{categoryNames[selectedBadge.category] || selectedBadge.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raridade</span>
                  <Badge variant="outline" className="capitalize">{selectedBadge.rarity}</Badge>
                </div>
                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conquistado em</span>
                    <span className="font-medium">{selectedBadge.earnedAt.toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                {!selectedBadge.earned && (
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <Lock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Complete o objetivo para desbloquear</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
