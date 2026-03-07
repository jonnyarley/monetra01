import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { 
  PRODUCT_TO_PLAN, 
  verifySubscription, 
  acknowledgePurchase,
} from "@/lib/google-play"
import { getJwtSecret } from "@/lib/jwt-secret"

// Schema de validação
const validateSchema = z.object({
  productId: z.string(),
  purchaseToken: z.string(),
  orderId: z.string().optional(),
  packageName: z.string().optional(),
})

// Validar e ativar assinatura do Google Play
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const result = validateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const { productId, purchaseToken, orderId, packageName } = result.data
    const pkgName = packageName || "com.monetra.app"

    // Verificar assinatura com Google Play API (ou mock em desenvolvimento)
    const subscriptionData = await verifySubscription(pkgName, productId, purchaseToken)

    if (!subscriptionData) {
      return NextResponse.json(
        { success: false, error: "Não foi possível verificar a assinatura" },
        { status: 400 }
      )
    }

    // Determinar o plano baseado no produto
    const productInfo = PRODUCT_TO_PLAN[productId]
    if (!productInfo) {
      return NextResponse.json(
        { success: false, error: "Produto não reconhecido" },
        { status: 400 }
      )
    }

    // Calcular data de expiração
    const subscriptionEnd = new Date(parseInt(subscriptionData.expiryTimeMillis))

    // Acknowledge a compra se necessário
    if (subscriptionData.acknowledgementState === 0) {
      await acknowledgePurchase(pkgName, productId, purchaseToken)
    }

    // Atualizar usuário com a assinatura
    const updatedUser = await db.user.update({
      where: { id: decoded.id },
      data: {
        plan: productInfo.plan,
        subscriptionStatus: "ACTIVE",
        subscriptionEnd,
        subscriptionAutoRenewing: subscriptionData.autoRenewing,
        googlePlayProductId: productId,
        googlePlayPurchaseToken: purchaseToken,
        googlePlayOrderId: subscriptionData.orderId || orderId || null,
        googlePlayPackageName: pkgName,
      }
    })

    // Criar log de auditoria
    await db.auditLog.create({
      data: {
        userId: decoded.id,
        action: "SUBSCRIPTION_ACTIVATED",
        entity: "subscription",
        entityId: subscriptionData.orderId || orderId || "unknown",
        newData: JSON.stringify({
          productId,
          plan: productInfo.plan,
          expiryTime: subscriptionEnd.toISOString(),
          autoRenewing: subscriptionData.autoRenewing,
        }),
      }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        plan: updatedUser.plan,
        status: updatedUser.subscriptionStatus,
        subscriptionEnd: updatedUser.subscriptionEnd,
        isActive: true,
        autoRenewing: subscriptionData.autoRenewing,
      }
    })

  } catch (error) {
    console.error("Validate purchase error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao validar compra" },
      { status: 500 }
    )
  }
}
