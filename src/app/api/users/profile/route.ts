import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const userData = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        currency: true,
        language: true,
        timezone: true,
        theme: true,
        plan: true,
        financialScore: true,
        totalPoints: true,
        level: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const { name, currency, language, timezone } = body

    const updatedUser = await db.user.update({
      where: { id: decoded.id },
      data: {
        name: name || null,
        currency: currency || "BRL",
        language: language || "pt-BR",
        timezone: timezone || "America/Sao_Paulo",
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        currency: true,
        language: true,
        timezone: true,
        theme: true,
        plan: true,
        financialScore: true,
        totalPoints: true,
        level: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
