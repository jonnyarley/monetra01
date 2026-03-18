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

    // Get fresh user data
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
        subscriptionEnd: true,
        trialEndsAt: true,
        trialUsed: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    // Check if trial has expired
    const trialExpired = user.trialEndsAt ? new Date() > user.trialEndsAt : false
    const daysLeft = user.trialEndsAt 
      ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        trialExpired,
        trialDaysLeft: daysLeft
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
