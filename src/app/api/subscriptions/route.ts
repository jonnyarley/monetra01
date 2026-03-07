import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { PLANS_ARRAY, getPlanDefinition } from "@/lib/plans"

// Obter status da assinatura do usuário e planos disponíveis
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
        subscriptionAutoRenewing: true,
        googlePlayProductId: true,
        googlePlayOrderId: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Determinar se a assinatura está ativa
    const isActive = user.subscriptionStatus === "ACTIVE" && 
                     user.subscriptionEnd && 
                     new Date(user.subscriptionEnd) > new Date()

    // Obter definição do plano atual
    const currentPlan = getPlanDefinition(user.plan)

    return NextResponse.json({
      plan: user.plan,
      planDetails: currentPlan,
      status: user.subscriptionStatus,
      isActive,
      subscriptionEnd: user.subscriptionEnd,
      autoRenewing: user.subscriptionAutoRenewing,
      productId: user.googlePlayProductId,
      orderId: user.googlePlayOrderId,
      availablePlans: PLANS_ARRAY,
    })

  } catch (error) {
    console.error("Get subscription error:", error)
    return NextResponse.json(
      { error: "Erro ao obter assinatura" },
      { status: 500 }
    )
  }
}
