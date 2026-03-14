"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useAppStore } from "@/lib/store"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
        <footer className="h-12 border-t border-border flex items-center justify-center px-4 bg-background/95 backdrop-blur flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Monetra. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  )
}
