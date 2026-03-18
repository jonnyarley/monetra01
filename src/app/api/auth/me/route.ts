import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Get fresh user data - campos que podem existir
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        currency: true,
        language: true,
        theme: true,
        financialScore: true,
        totalPoints: true,
        level: true,
        subscriptionStatus: true,
        subscriptionEnd: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    // Tentar buscar campos de trial separadamente (podem não existir)
    let trialData = { trialEndsAt: null, trialExpired: false, trialDaysLeft: 0 }
    try {
      const userWithTrial = await db.user.findUnique({
        where: { id: decoded.id },
        select: { trialEndsAt: true }
      })
      if (userWithTrial?.trialEndsAt) {
        trialData = {
          trialEndsAt: userWithTrial.trialEndsAt,
          trialExpired: new Date() > userWithTrial.trialEndsAt,
          trialDaysLeft: Math.max(0, Math.ceil((userWithTrial.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        }
      }
    } catch (e) {
      // Campo não existe, ignorar
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        ...trialData
      }
    })

  } catch (error) {
    console.error("Auth verify error:", error)
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    )
  }
}
