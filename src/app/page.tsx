"use client"
// Monetra - Main Page - Force recompile v3
import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { AuthForm } from "@/components/auth/auth-form"
import { MainLayout } from "@/components/layout/main-layout"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { TransactionsView } from "@/components/transactions/transactions-view"
import { AccountsView } from "@/components/accounts/accounts-view"
import { GoalsView } from "@/components/goals/goals-view"
import { BudgetsView } from "@/components/budgets/budgets-view"
import { CalendarView } from "@/components/calendar/calendar-view"
import { ReportsView } from "@/components/reports/reports-view"
import { MonScoreView } from "@/components/monscore/monscore-view"
import { SettingsView } from "@/components/settings/settings-view"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function Home() {
  const { isAuthenticated, isAuthLoading, isAdmin, currentView, setAuthLoading } = useAppStore()

  useEffect(() => {
    // Simulate checking auth state
    const timer = setTimeout(() => {
      setAuthLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [setAuthLoading])

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/20">
            <img src="/logo-small.svg" alt="Monetra" className="w-12 h-12" />
          </div>
          <p className="text-muted-foreground">Carregando Monetra...</p>
        </div>
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm />
  }

  // Show Admin Dashboard for admin users
  if (isAdmin) {
    return (
      <MainLayout>
        <AdminDashboard />
      </MainLayout>
    )
  }

  // Render the main application for regular users
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "transactions":
        return <TransactionsView />
      case "accounts":
        return <AccountsView />
      case "calendar":
        return <CalendarView />
      case "goals":
        return <GoalsView />
      case "budgets":
        return <BudgetsView />
      case "reports":
        return <ReportsView />
      case "monscore":
        return <MonScoreView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return <MainLayout>{renderView()}</MainLayout>
}
