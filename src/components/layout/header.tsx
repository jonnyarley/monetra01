"use client"

import { useAppStore } from "@/lib/store"
import { Bell, Search, Moon, Sun, User, LogOut, HelpCircle, Settings, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function Header() {
  const { user, notifications, setCurrentView, setSidebarOpen, reset, setAuthenticated } = useAppStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleLogout = async () => {
    try {
      // Chamar API de logout
      await fetch("/api/auth/logout/", { method: "POST" })
      
      // Limpar estado local
      reset()
      setAuthenticated(false)
      
      toast.success("Logout realizado com sucesso!")
      
      // Recarregar a página para voltar ao login
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Erro ao fazer logout")
    }
  }

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6 flex items-center justify-between gap-2 md:gap-4">
      {/* Left Side - Menu + Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0 h-9 w-9"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search - Hidden on very small screens */}
        <div className="hidden sm:block relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações, contas..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 w-full"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full h-9 w-9"
          aria-label="Alternar tema"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Help - Hidden on mobile */}
        <Button variant="ghost" size="icon" className="rounded-full hidden md:flex h-9 w-9">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 md:w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {unreadCount} novas
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">
                Nenhuma notificação
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    <span className="font-medium">{notification.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1 md:pr-3 rounded-full h-9">
              <Avatar className="h-8 w-8 border-2 border-amber-500/50">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white text-sm">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name || "Usuário"}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.plan || "free"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCurrentView("settings")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentView("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
