"use client"
// Monex - Main Page
import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { LandingPage } from "@/components/landing/landing-page"
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
import { HelpView } from "@/components/help/help-view"
import { RecurringView } from "@/components/recurring/recurring-view"
import { RemindersView } from "@/components/reminders/reminders-view"
import { ExportsView } from "@/components/exports/exports-view"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { FamilyView } from "@/components/family/family-view"
import { TeraAssistantView } from "@/components/assistant/assistant-view"
import { TrialExpiredModal } from "@/components/auth/trial-expired-modal"

export default function Home() {
  const { isAuthenticated, isAuthLoading, isAdmin, currentView, setAuthLoading, setCurrentView, user } = useAppStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTrialExpired, setShowTrialExpired] = useState(false)

  useEffect(() => {
    // Simulate checking auth state
    const timer = setTimeout(() => {
      setAuthLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [setAuthLoading])

  useEffect(() => {
    // Check if user needs to see onboarding
    const checkOnboarding = async () => {
      if (!isAuthenticated || isAdmin) return
      
      try {
        const response = await fetch("/api/onboarding")
        const data = await response.json()
        
        if (data.hasOnboarding) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error("Error checking onboarding:", error)
      }
    }
    
    checkOnboarding()
  }, [isAuthenticated, isAdmin])

  // Check if trial has expired
  useEffect(() => {
    if (!isAuthenticated || isAdmin || !user) return
    
    // User with paid plan doesn't need to see trial modal
    if (user.plan !== "FREE") return
    
    // Check if trial has expired - use setTimeout to avoid lint error
    if (user.trialExpired) {
      const timer = setTimeout(() => {
        setShowTrialExpired(true)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isAdmin, user])

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false)
    setCurrentView("dashboard")
  }

  const handleNavigateFromOnboarding = (view: string) => {
    setCurrentView(view as "dashboard" | "transactions" | "accounts" | "calendar" | "goals" | "budgets" | "reports" | "monscore" | "settings" | "help" | "recurring" | "reminders" | "exports" | "assistant")
    setShowOnboarding(false)
  }

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo-small.svg" alt="Monex" className="w-12 h-12" />
          </div>
          <p className="text-muted-foreground">Carregando Monex...</p>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />
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
      case "help":
        return <HelpView />
      case "recurring":
        return <RecurringView />
      case "reminders":
        return <RemindersView />
      case "exports":
        return <ExportsView />
      case "family":
        return <FamilyView />
      case "assistant":
        return <TeraAssistantView />
      default:
        return <DashboardView />
    }
  }

  return (
    <>
      <TrialExpiredModal isOpen={showTrialExpired} />
      <MainLayout>
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleCompleteOnboarding}
          onNavigate={handleNavigateFromOnboarding}
        />
        {renderView()}
      </MainLayout>
    </>
  )
}
