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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const menuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "transactions", label: "Transações", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: "accounts", label: "Contas e Cartões", icon: <Wallet className="h-5 w-5" /> },
  { id: "calendar", label: "Calendário", icon: <Calendar className="h-5 w-5" /> },
  { id: "goals", label: "Metas", icon: <Target className="h-5 w-5" /> },
  { id: "budgets", label: "Orçamentos", icon: <PiggyBank className="h-5 w-5" /> },
  { id: "reports", label: "Relatórios IA", icon: <Sparkles className="h-5 w-5" /> },
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

// Desktop Sidebar Content - com suporte a colapsar
function DesktopSidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  const { currentView, setCurrentView, setSettingsTab, isAdmin, reset, setAuthenticated, setIsAdmin, setUser } = useAppStore()

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
    <div className="flex flex-col h-full">
      {/* Admin Badge */}
      {isAdmin && !isCollapsed && (
        <div className="p-2 border-b border-amber-900/20">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Administrador</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {items.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                "hover:bg-amber-900/30 group",
                isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/20"
                  : "text-amber-100/70 hover:text-white"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={cn(
                "flex-shrink-0 transition-transform duration-200",
                "group-hover:scale-110"
              )}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Admin Logout Button */}
      {isAdmin && (
        <div className="p-2 flex-shrink-0 border-t border-amber-900/20">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
              "hover:bg-red-900/30 group text-red-300/70 hover:text-red-300",
              isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
            )}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">Sair</span>
            )}
          </button>
        </div>
      )}

      {/* Pro Badge - só mostra quando expandido e não é admin */}
      {!isAdmin && !isCollapsed && (
        <div className="p-2 flex-shrink-0">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-300">Upgrade Pro</span>
            </div>
            <p className="text-[9px] text-amber-200/70 mb-1.5 leading-tight">
              IA avançada e mais!
            </p>
            <Button
              size="sm"
              className="w-full h-6 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={handleVerPlanos}
            >
              Ver Planos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile Sidebar Content
function MobileSidebarContent({ onClose }: { onClose: () => void }) {
  const { currentView, setCurrentView, setSettingsTab, isAdmin, reset, setAuthenticated, setIsAdmin, setUser } = useAppStore()

  const handleVerPlanos = () => {
    setSettingsTab("billing")
    setCurrentView("settings")
    onClose()
  }

  const handleLogout = () => {
    reset()
    setAuthenticated(false)
    setIsAdmin(false)
    setUser(null)
    toast.success("Logout realizado com sucesso!")
    onClose()
  }

  const items = isAdmin ? adminMenuItems : menuItems

  return (
    <div className="flex flex-col h-full">
      {/* Admin Badge */}
      {isAdmin && (
        <div className="p-3 border-b border-amber-900/20">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-300">Administrador</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id)
                onClose()
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-amber-900/30 group",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/20"
                  : "text-amber-100/70 hover:text-white"
              )}
            >
              <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Admin Logout Button */}
      {isAdmin && (
        <div className="p-3 flex-shrink-0 border-t border-amber-900/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:bg-red-900/30 text-red-300/70 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium whitespace-nowrap">Sair</span>
          </button>
        </div>
      )}

      {/* Pro Badge - Mobile - só para não admin */}
      {!isAdmin && (
        <div className="p-3 flex-shrink-0">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Upgrade Pro</span>
            </div>
            <p className="text-[10px] text-amber-200/70 mb-2">
              Desbloqueie IA avançada e mais!
            </p>
            <Button
              size="sm"
              className="w-full h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={handleVerPlanos}
            >
              Ver Planos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile Sidebar Overlay
function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-[260px] bg-gradient-to-b from-amber-950 to-slate-950 border-r border-amber-900/30 z-50 md:hidden"
          >
            {/* Logo */}
            <div className="flex items-center justify-between h-14 px-3 border-b border-amber-900/20">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 shadow-lg overflow-hidden">
                  <img src="/logo-small.svg" alt="Monetra" className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monetra</h1>
                  <p className="text-[10px] text-amber-400/70">Gestão Financeira</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-amber-900/20 text-amber-100/70 hover:text-amber-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <MobileSidebarContent onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// Desktop Sidebar
function DesktopSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const isCollapsed = !sidebarOpen

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex relative flex-col h-full bg-gradient-to-b from-amber-950 to-slate-950 border-r border-amber-900/30 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-14 border-b border-amber-900/20 px-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 shadow-lg overflow-hidden flex-shrink-0">
            <img src="/logo-small.svg" alt="Monetra" className="w-7 h-7" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Monetra</h1>
                <p className="text-[10px] text-amber-400/70">Gestão Financeira</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DesktopSidebarContent isCollapsed={isCollapsed} />

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 w-6 h-6 flex items-center justify-center rounded-full bg-amber-500 border-2 border-slate-950 text-white hover:bg-amber-400 transition-colors shadow-lg z-10"
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
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
