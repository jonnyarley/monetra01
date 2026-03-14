import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { getAdminJwtSecret } from "@/lib/jwt-secret"
import { ADMIN_CONFIG } from "@/lib/admin-config"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const jwtSecret = getAdminJwtSecret()
    const decoded = verify(token, jwtSecret) as { email: string; role: string }

    // Verificar se é admin
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { authenticated: false },
        { status: 403 }
      )
    }

    // Verificar se o email corresponde ao admin configurado
    if (decoded.email.toLowerCase() !== ADMIN_CONFIG.email.toLowerCase()) {
      return NextResponse.json(
        { authenticated: false },
        { status: 403 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        email: decoded.email,
        role: decoded.role
      }
    })

  } catch (error) {
    console.error("Admin verify error:", error)
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}
