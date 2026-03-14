"use client"

import { useAppStore } from "@/lib/store"
import { ViewType } from "@/types"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
  Trophy,
  Shield,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  RefreshCw,
  Bell,
  Download,
  Bot,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const menuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "assistant", label: "Assistente IA", icon: <Bot className="h-5 w-5" /> },
  { id: "transactions", label: "Transações", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: "accounts", label: "Contas e Cartões", icon: <Wallet className="h-5 w-5" /> },
  { id: "calendar", label: "Calendário", icon: <Calendar className="h-5 w-5" /> },
  { id: "goals", label: "Metas", icon: <Target className="h-5 w-5" /> },
  { id: "budgets", label: "Orçamentos", icon: <PiggyBank className="h-5 w-5" /> },
  { id: "recurring", label: "Recorrentes", icon: <RefreshCw className="h-5 w-5" /> },
  { id: "reminders", label: "Lembretes", icon: <Bell className="h-5 w-5" /> },
  { id: "reports", label: "Relatórios IA", icon: <Sparkles className="h-5 w-5" /> },
  { id: "exports", label: "Exportar", icon: <Download className="h-5 w-5" /> },
  { id: "family", label: "Família", icon: <Users className="h-5 w-5" /> },
  { id: "monscore", label: "Mone Score", icon: <Trophy className="h-5 w-5" /> },
  { id: "settings", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
]

const adminMenuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard Admin", icon: <Shield className="h-5 w-5" /> },
  { id: "transactions", label: "Usuários", icon: <Users className="h-5 w-5" /> },
  { id: "accounts", label: "Assinaturas", icon: <DollarSign className="h-5 w-5" /> },
  { id: "reports", label: "Relatórios", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "settings", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
]

// Desktop Sidebar
function DesktopSidebar() {
  const { currentView, setCurrentView, setSettingsTab, sidebarOpen, setSidebarOpen, isAdmin, reset, setAuthenticated, setIsAdmin, setUser } = useAppStore()
  const isCollapsed = !sidebarOpen

  const handleVerPlanos = () => {
    setSettingsTab("billing")
    setCurrentView("settings")
  }

  const handleLogout = () => {
    reset()
    setAuthenticated(false)
    setIsAdmin(false)
    setUser(null)
    toast.success("Logout realizado com sucesso!")
  }

  const items = isAdmin ? adminMenuItems : menuItems

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-full bg-gradient-to-b from-amber-950 to-slate-950 border-r border-amber-900/30 flex-shrink-0 relative"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-amber-900/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 flex items-center justify-center overflow-hidden">
            <img src="/logo-small.svg" alt="Monetra" className="w-7 h-7" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monetra</h1>
              <p className="text-[10px] text-amber-400/70">Gestão Financeira</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Badge */}
      {isAdmin && sidebarOpen && (
        <div className="px-3 py-2 border-b border-amber-900/20 flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Administrador</span>
          </div>
        </div>
      )}

      {/* Menu - com scroll */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {items.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all",
                "hover:bg-amber-900/30 group",
                isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
                  : "text-amber-100/70 hover:text-white"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer fixo - sempre visível */}
      <div className="flex-shrink-0 border-t border-amber-900/30 bg-amber-950">
        {/* Admin Logout */}
        {isAdmin ? (
          <div className="p-2">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all hover:bg-red-900/30 text-red-300/70 hover:text-red-300",
                isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
              )}
              title={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
            </button>
          </div>
        ) : (
          /* Card Upgrade Pro - SEMPRE VISÍVEL */
          !isCollapsed && (
            <div className="p-3">
              <button
                onClick={handleVerPlanos}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-yellow-300 hover:border-white transition-all shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-white" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white">Upgrade Pro</p>
                  <p className="text-xs text-white/80">Recursos exclusivos</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          )
        )}
      </div>

      {/* Toggle Button - NO MEIO DA BARRA LATERAL */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-12 rounded-l-lg bg-amber-500 border-2 border-r-0 border-slate-950 text-white hover:bg-amber-400 shadow-lg z-20 flex items-center justify-center"
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </motion.aside>
  )
}

// Mobile Sidebar
function MobileSidebar() {
  const { currentView, setCurrentView, setSettingsTab, sidebarOpen, setSidebarOpen, isAdmin, reset, setAuthenticated, setIsAdmin, setUser } = useAppStore()

  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null
  }

  const handleVerPlanos = () => {
    setSettingsTab("billing")
    setCurrentView("settings")
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    reset()
    setAuthenticated(false)
    setIsAdmin(false)
    setUser(null)
    toast.success("Logout realizado com sucesso!")
    setSidebarOpen(false)
  }

  const items = isAdmin ? adminMenuItems : menuItems

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
          
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-[260px] bg-gradient-to-b from-amber-950 to-slate-950 border-r border-amber-900/30 z-50 md:hidden flex flex-col overflow-hidden"
          >
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-amber-900/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 flex items-center justify-center overflow-hidden">
                  <img src="/logo-small.svg" alt="Monetra" className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monetra</h1>
                  <p className="text-[10px] text-amber-400/70">Gestão Financeira</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-amber-900/20 text-amber-100/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Admin Badge */}
            {isAdmin && (
              <div className="px-3 py-2 border-b border-amber-900/20 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-300">Administrador</span>
                </div>
              </div>
            )}

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
              {items.map((item) => {
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                      "hover:bg-amber-900/30 group",
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
                        : "text-amber-100/70 hover:text-white"
                    )}
                  >
                    <span className="flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Footer fixo */}
            <div className="flex-shrink-0 border-t border-amber-900/30 bg-amber-950">
              {isAdmin ? (
                <div className="p-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all hover:bg-red-900/30 text-red-300/70 hover:text-red-300"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              ) : (
                <div className="p-3">
                  <button
                    onClick={handleVerPlanos}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-yellow-300 hover:border-white transition-all shadow-lg"
                  >
                    <Sparkles className="h-5 w-5 text-white" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-white">Upgrade Pro</p>
                      <p className="text-xs text-white/80">Recursos exclusivos</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}
