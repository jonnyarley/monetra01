import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { 
  DeveloperNotification, 
  SUBSCRIPTION_NOTIFICATION_TYPES,
  PRODUCT_TO_PLAN,
  verifySubscription 
} from "@/lib/google-play"

// Webhook para Google Play Real-time Developer Notifications
// https://developers.google.com/android-publisher/rtdn

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Parse do Base64 se for Pub/Sub message
    let notification: DeveloperNotification
    
    if (body.message?.data) {
      // Formato Pub/Sub
      const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8')
      notification = JSON.parse(decodedData)
    } else {
      // Formato direto
      notification = body
    }

    console.log("Google Play notification received:", JSON.stringify(notification, null, 2))

    const { packageName, eventTimeMillis, subscriptionNotification, oneTimeProductNotification, voidedPurchaseNotification } = notification

    // Processar notificação de assinatura
    if (subscriptionNotification) {
      await processSubscriptionNotification(packageName, subscriptionNotification, eventTimeMillis)
    }

    // Processar notificação de compra única
    if (oneTimeProductNotification) {
      await processOneTimeProductNotification(packageName, oneTimeProductNotification)
    }

    // Processar notificação de compra cancelada/estornada
    if (voidedPurchaseNotification) {
      await processVoidedPurchaseNotification(voidedPurchaseNotification)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Google Play webhook error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Processar notificação de assinatura
async function processSubscriptionNotification(
  packageName: string,
  notification: NonNullable<DeveloperNotification['subscriptionNotification']>,
  eventTimeMillis: string
) {
  const { notificationType, purchaseToken, subscriptionId } = notification
  const notificationName = SUBSCRIPTION_NOTIFICATION_TYPES[notificationType as keyof typeof SUBSCRIPTION_NOTIFICATION_TYPES]
  
  console.log(`Processing subscription notification: ${notificationName} for ${subscriptionId}`)

  // Encontrar usuário pelo purchase token
  const user = await db.user.findFirst({
    where: { googlePlayPurchaseToken: purchaseToken }
  })

  if (!user) {
    console.log(`User not found for purchase token: ${purchaseToken}`)
    return
  }

  const productInfo = PRODUCT_TO_PLAN[subscriptionId]
  
  switch (notificationName) {
    case "PURCHASED":
    case "RECOVERED":
    case "RESTARTED":
    case "RENEWED":
      // Verificar assinatura com Google Play API
      const subscriptionData = await verifySubscription(packageName, subscriptionId, purchaseToken)
      
      if (subscriptionData) {
        const expiryTime = new Date(parseInt(subscriptionData.expiryTimeMillis))
        
        await db.user.update({
          where: { id: user.id },
          data: {
            plan: productInfo?.plan || user.plan,
            subscriptionStatus: "ACTIVE",
            subscriptionEnd: expiryTime,
            subscriptionAutoRenewing: subscriptionData.autoRenewing,
            googlePlayProductId: subscriptionId,
            googlePlayPackageName: packageName,
          }
        })

        console.log(`Subscription activated for user ${user.email} until ${expiryTime}`)
      }
      break

    case "CANCELED":
      // Marcar para não renovar, mas manter acesso até expirar
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionAutoRenewing: false,
        }
      })
      console.log(`Subscription canceled for user ${user.email}`)
      break

    case "EXPIRED":
    case "REVOKED":
      // Assinatura expirou ou foi revogada
      await db.user.update({
        where: { id: user.id },
        data: {
          plan: "FREE",
          subscriptionStatus: "CANCELED",
          subscriptionAutoRenewing: false,
        }
      })
      console.log(`Subscription expired/revoked for user ${user.email}`)
      break

    case "ON_HOLD":
    case "IN_GRACE_PERIOD":
      // Pagamento falhou, mas ainda em período de graça
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "PAST_DUE",
        }
      })
      console.log(`Subscription on hold/grace period for user ${user.email}`)
      break

    case "PAUSED":
      // Assinatura pausada
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "INCOMPLETE",
        }
      })
      console.log(`Subscription paused for user ${user.email}`)
      break

    default:
      console.log(`Unhandled notification type: ${notificationName}`)
  }

  // Criar log de auditoria
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: `SUBSCRIPTION_${notificationName}`,
      entity: "subscription",
      entityId: subscriptionId,
      newData: JSON.stringify({
        notificationType: notificationName,
        packageName,
        eventTime: new Date(parseInt(eventTimeMillis)).toISOString(),
      }),
    }
  })
}

// Processar notificação de compra única
async function processOneTimeProductNotification(
  packageName: string,
  notification: NonNullable<DeveloperNotification['oneTimeProductNotification']>
) {
  const { notificationType, purchaseToken, sku } = notification
  
  console.log(`Processing one-time product notification for ${sku}`)

  // Encontrar usuário pelo purchase token
  const user = await db.user.findFirst({
    where: { googlePlayPurchaseToken: purchaseToken }
  })

  if (!user) {
    console.log(`User not found for purchase token: ${purchaseToken}`)
    return
  }

  // Tipos de notificação para compra única
  // 1 = Purchased
  // 2 = Canceled

  if (notificationType === 1) {
    // Compra realizada
    const productInfo = PRODUCT_TO_PLAN[sku]
    
    if (productInfo) {
      const expiryDate = new Date()
      if (productInfo.duration === "yearly") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1)
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          plan: productInfo.plan,
          subscriptionStatus: "ACTIVE",
          subscriptionEnd: expiryDate,
          googlePlayProductId: sku,
          googlePlayPackageName: packageName,
        }
      })

      console.log(`One-time purchase activated for user ${user.email}`)
    }
  } else if (notificationType === 2) {
    // Compra cancelada
    await db.user.update({
      where: { id: user.id },
        data: {
        plan: "FREE",
        subscriptionStatus: "CANCELED",
      }
    })

    console.log(`One-time purchase canceled for user ${user.email}`)
  }
}

// Processar notificação de compra cancelada/estornada
async function processVoidedPurchaseNotification(
  notification: NonNullable<DeveloperNotification['voidedPurchaseNotification']>
) {
  const { purchaseToken, orderId } = notification
  
  console.log(`Processing voided purchase notification for order ${orderId}`)

  // Encontrar usuário pelo purchase token
  const user = await db.user.findFirst({
    where: { 
      OR: [
        { googlePlayPurchaseToken: purchaseToken },
        { googlePlayOrderId: orderId }
      ]
    }
  })

  if (!user) {
    console.log(`User not found for voided purchase: ${orderId}`)
    return
  }

  // Reverter para plano gratuito
  await db.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      subscriptionAutoRenewing: false,
    }
  })

  console.log(`Voided purchase processed for user ${user.email}`)

  // Criar log de auditoria
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PURCHASE_VOIDED",
      entity: "subscription",
      entityId: orderId,
      newData: JSON.stringify({ orderId, purchaseToken }),
    }
  })
}

// GET para verificação do webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Google Play webhook endpoint is active"
  })
}
