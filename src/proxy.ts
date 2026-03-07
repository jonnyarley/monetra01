import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import type { NextRequest } from "next/server"

// Rotas que requerem autenticação de usuário
const protectedRoutes = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/cards",
  "/goals",
  "/budgets",
  "/reports",
  "/settings",
  "/monscore",
  "/achievements"
]

// Rotas de admin
const adminRoutes = [
  "/admin"
]

// Rotas públicas
const publicRoutes = [
  "/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/admin/auth"
]

// Security Headers
function addSecurityHeaders(response: NextResponse) {
  // X-Frame-Options - Proteção contra clickjacking
  response.headers.set("X-Frame-Options", "DENY")
  
  // X-Content-Type-Options - Previne MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")
  
  // X-XSS-Protection - Proteção contra XSS (legacy, mas útil)
  response.headers.set("X-XSS-Protection", "1; mode=block")
  
  // Referrer-Policy - Controla informações de referrer
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Permissions-Policy - Controla acesso a features do browser
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  
  // Content-Security-Policy - Política de segurança de conteúdo
  // Permissiva para funcionar com Next.js 16 e Vercel
  const csp = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://vercel.live wss://vercel.live; frame-src 'self' https://vercel.live;"

  response.headers.set("Content-Security-Policy", csp)
  
  // Strict-Transport-Security (HSTS) - Force HTTPS (apenas em produção)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignorar arquivos estáticos e _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/admin/verify") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Verificar se é uma rota de admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isAdminRoute && !isProtectedRoute) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Obter tokens dos cookies
  const authToken = request.cookies.get("auth_token")?.value
  const adminToken = request.cookies.get("admin_token")?.value

  const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "monetra-development-secret-key-2024-secure"

  // Verificar acesso de admin
  if (isAdminRoute) {
    if (!adminToken) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
    }

    try {
      const decoded = verify(adminToken, jwtSecret) as { email: string; role: string }
      
      if (decoded.role !== "admin") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
      }

      // Adicionar info do admin aos headers
      const response = NextResponse.next()
      response.headers.set("x-admin-email", decoded.email)
      response.headers.set("x-admin-role", decoded.role)
      
      return addSecurityHeaders(response)
    } catch {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
    }
  }

  // Verificar acesso de usuário
  if (isProtectedRoute) {
    if (!authToken) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)))
    }

    try {
      const decoded = verify(authToken, jwtSecret) as { id: string; email: string }
      
      // Adicionar info do usuário aos headers
      const response = NextResponse.next()
      response.headers.set("x-user-id", decoded.id)
      response.headers.set("x-user-email", decoded.email)
      
      return addSecurityHeaders(response)
    } catch {
      // Token inválido ou expirado
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.delete("auth_token")
      return addSecurityHeaders(response)
    }
  }

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
