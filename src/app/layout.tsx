import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Monetra - Gestão Financeira Inteligente",
  description: "Plataforma moderna de gestão financeira pessoal e empresarial com IA. Controle seus gastos, alcance suas metas e transforme suas finanças.",
  keywords: ["finanças pessoais", "gestão financeira", "controle de gastos", "orçamento", "metas financeiras", "IA financeira", "dashboard financeiro"],
  authors: [{ name: "Monetra" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Monetra - Gestão Financeira Inteligente",
    description: "Controle total das suas finanças com inteligência artificial",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
