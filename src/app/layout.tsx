import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "Monex - Gestão Financeira Inteligente",
    template: "%s | Monex",
  },
  description: "Plataforma moderna de gestão financeira pessoal e empresarial com IA. Controle seus gastos, alcance suas metas e transforme suas finanças.",
  keywords: ["finanças pessoais", "gestão financeira", "controle de gastos", "orçamento", "metas financeiras", "IA financeira", "dashboard financeiro"],
  authors: [{ name: "Monex" }],
  creator: "Monex",
  publisher: "Monex",
  
  // PWA
  manifest: "/manifest.json",
  
  // Icons
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://monex.app",
    siteName: "Monex",
    title: "Monex - Gestão Financeira Inteligente",
    description: "Controle total das suas finanças com inteligência artificial",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monex - Gestão Financeira",
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Monex - Gestão Financeira Inteligente",
    description: "Controle total das suas finanças com inteligência artificial",
    images: ["/og-image.png"],
  },
  
  // App info
  applicationName: "Monex",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Monex",
  },
  formatDetection: {
    telephone: false,
  },
  
  // Other
  metadataBase: new URL("https://monex.app"),
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Monex" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
      </head>
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
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
