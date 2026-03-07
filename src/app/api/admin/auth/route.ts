import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import { ADMIN_CONFIG } from "@/lib/admin-config"
import { getAdminJwtSecret } from "@/lib/jwt-secret"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("=== ADMIN LOGIN ATTEMPT ===")
    console.log("Email recebido:", email)
    console.log("Email esperado:", ADMIN_CONFIG.email)

    // Validar campos obrigatórios
    if (!email || !password) {
      console.log("ERRO: Email ou senha vazios")
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Verificar email
    if (emailLower !== ADMIN_CONFIG.email.toLowerCase()) {
      console.log("ERRO: Email não corresponde")
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log("Email correto! Verificando senha...")

    // Verificar senha com bcrypt
    const passwordMatch = await compare(password, ADMIN_CONFIG.passwordHash)
    console.log("Senha confere:", passwordMatch)
    
    if (!passwordMatch) {
      console.log("ERRO: Senha incorreta")
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    console.log("SUCESSO! Gerando token...")

    // Gerar JWT token seguro
    const jwtSecret = getAdminJwtSecret()

    const token = sign(
      { 
        email: ADMIN_CONFIG.email, 
        role: "admin",
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: "24h",
        algorithm: "HS256"
      }
    )

    // Definir cookie seguro
    const cookieStore = await cookies()
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/"
    })

    console.log("Token gerado e cookie definido!")

    return NextResponse.json({
      success: true,
      admin: {
        email: ADMIN_CONFIG.email,
        name: "Jonny Arley",
        role: "admin"
      }
    })

  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
