// Google Play Billing Integration
// https://developers.google.com/android-publisher

import { google } from "googleapis"

// Configuração do Google Play Developer API
const getAndroidPublisherClient = () => {
  const credentials = {
    client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PLAY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  if (!credentials.client_email || !credentials.private_key) {
    console.warn("Google Play credentials not configured")
    return null
  }

  return google.androidpublisher({
    version: 'v3',
    auth: new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/androidpublisher']
    )
  })
}

// Interface para dados de assinatura
export interface SubscriptionData {
  kind: string
  startTimeMillis: string
  expiryTimeMillis: string
  autoRenewing: boolean
  priceCurrencyCode: string
  priceAmountMicros: string
  countryCode: string
  developerPayload: string
  paymentState: number
  orderId: string
  purchaseType: number
  acknowledgementState: number
}

// Interface para dados de compra única
export interface PurchaseData {
  kind: string
  purchaseTimeMillis: string
  purchaseState: number
  consumptionState: number
  developerPayload: string
  orderId: string
  acknowledgementState: number
  productId: string
}

// Mapeamento de produtos para planos
export const PRODUCT_TO_PLAN: Record<string, { plan: "BASIC" | "PRO" | "BUSINESS", duration: "monthly" | "yearly" }> = {
  "basic_monthly": { plan: "BASIC", duration: "monthly" },
  "basic_yearly": { plan: "BASIC", duration: "yearly" },
  "monetra_pro_monthly": { plan: "PRO", duration: "monthly" },
  "monetra_pro_yearly": { plan: "PRO", duration: "yearly" },
  "monetra_business_monthly": { plan: "BUSINESS", duration: "monthly" },
  "monetra_business_yearly": { plan: "BUSINESS", duration: "yearly" },
}

// Preços dos planos (em centavos)
export const PLAN_PRICES = {
  BASIC: {
    monthly: 1490, // R$ 14,90
    yearly: 14990, // R$ 149,90 (2 meses grátis)
  },
  PRO: {
    monthly: 2490, // R$ 24,90
    yearly: 24990, // R$ 249,90 (2 meses grátis)
  },
  BUSINESS: {
    monthly: 4990, // R$ 49,90
    yearly: 49900, // R$ 499,00 (2 meses grátis)
  }
}

// Features de cada plano
export const PLAN_FEATURES = {
  FREE: {
    name: "Gratuito",
    price: 0,
    features: [
      "Dashboard básico",
      "Até 3 contas",
      "Até 50 transações/mês",
      "1 meta financeira",
      "Relatórios limitados",
    ],
    limits: {
      accounts: 3,
      transactions: 50,
      goals: 1,
      budgets: 1,
      reports: "basic",
    }
  },
  BASIC: {
    name: "Básico",
    price: 14.90,
    yearlyPrice: 149.90,
    features: [
      "Transações ilimitadas",
      "Até 3 contas",
      "Até 2 cartões",
      "Até 3 metas",
      "Até 3 orçamentos",
      "3 relatórios IA/mês",
    ],
    limits: {
      accounts: 3,
      transactions: -1,
      goals: 3,
      budgets: 3,
      reports: "standard",
    }
  },
  PRO: {
    name: "Premium",
    price: 24.90,
    yearlyPrice: 249.90,
    features: [
      "Dashboard avançado",
      "Contas ilimitadas",
      "Transações ilimitadas",
      "Metas ilimitadas",
      "Relatórios com IA",
      "Exportação de dados",
      "Sincronização bancária",
    ],
    limits: {
      accounts: -1, // ilimitado
      transactions: -1,
      goals: -1,
      budgets: -1,
      reports: "advanced",
    }
  },
  BUSINESS: {
    name: "Business",
    price: 49.90,
    yearlyPrice: 499.90,
    features: [
      "Tudo do Premium",
      "Multi-moeda",
      "API Access",
      "Prioridade no suporte",
      "Backup automático",
      "Relatórios avançados",
      "IA Financeira completa",
    ],
    limits: {
      accounts: -1,
      transactions: -1,
      goals: -1,
      budgets: -1,
      reports: "full",
    }
  }
}

// Verificar assinatura com Google Play API
export async function verifySubscription(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string
): Promise<SubscriptionData | null> {
  try {
    const androidPublisher = getAndroidPublisherClient()
    
    if (!androidPublisher) {
      console.log("Google Play client not available, using mock verification")
      return mockVerifySubscription(subscriptionId)
    }

    const response = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    })

    if (response.data) {
      return response.data as SubscriptionData
    }

    return null
  } catch (error) {
    console.error("Error verifying subscription:", error)
    return null
  }
}

// Verificar compra única com Google Play API
export async function verifyPurchase(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<PurchaseData | null> {
  try {
    const androidPublisher = getAndroidPublisherClient()
    
    if (!androidPublisher) {
      console.log("Google Play client not available, using mock verification")
      return mockVerifyPurchase(productId)
    }

    const response = await androidPublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    })

    if (response.data) {
      return response.data as PurchaseData
    }

    return null
  } catch (error) {
    console.error("Error verifying purchase:", error)
    return null
  }
}

// Acknowledge purchase (marcar como reconhecida)
export async function acknowledgePurchase(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<boolean> {
  try {
    const androidPublisher = getAndroidPublisherClient()
    
    if (!androidPublisher) {
      return true // Mock success
    }

    await androidPublisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    })

    return true
  } catch (error) {
    console.error("Error acknowledging purchase:", error)
    return false
  }
}

// Cancelar assinatura
export async function cancelSubscription(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string
): Promise<boolean> {
  try {
    const androidPublisher = getAndroidPublisherClient()
    
    if (!androidPublisher) {
      return true // Mock success
    }

    await androidPublisher.purchases.subscriptions.cancel({
      packageName,
      subscriptionId,
      token: purchaseToken,
    })

    return true
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return false
  }
}

// Mock verification para desenvolvimento
function mockVerifySubscription(subscriptionId: string): SubscriptionData {
  const now = Date.now()
  const monthFromNow = now + (30 * 24 * 60 * 60 * 1000)
  
  return {
    kind: "androidpublisher#subscriptionPurchase",
    startTimeMillis: now.toString(),
    expiryTimeMillis: monthFromNow.toString(),
    autoRenewing: true,
    priceCurrencyCode: "BRL",
    priceAmountMicros: "19900000", // R$ 19.90
    countryCode: "BR",
    developerPayload: "",
    paymentState: 1, // Payment received
    orderId: `GPA.${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    purchaseType: 0,
    acknowledgementState: 1,
  }
}

function mockVerifyPurchase(productId: string): PurchaseData {
  return {
    kind: "androidpublisher#productPurchase",
    purchaseTimeMillis: Date.now().toString(),
    purchaseState: 0, // Purchased
    consumptionState: 0, // Not consumed
    developerPayload: "",
    orderId: `GPA.${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    acknowledgementState: 0,
    productId,
  }
}

// Calcular data de expiração baseada no produto
export function calculateExpiryDate(productId: string): Date {
  const expiry = new Date()
  const productInfo = PRODUCT_TO_PLAN[productId]
  
  if (productInfo) {
    if (productInfo.duration === "yearly") {
      expiry.setFullYear(expiry.getFullYear() + 1)
    } else {
      expiry.setMonth(expiry.getMonth() + 1)
    }
  } else {
    // Default to monthly
    expiry.setMonth(expiry.getMonth() + 1)
  }
  
  return expiry
}

// Processar notificação do Google Play (RTDN)
export interface DeveloperNotification {
  version: string
  packageName: string
  eventTimeMillis: string
  subscriptionNotification?: {
    version: string
    notificationType: number
    purchaseToken: string
    subscriptionId: string
  }
  oneTimeProductNotification?: {
    version: string
    notificationType: number
    purchaseToken: string
    sku: string
  }
  voidedPurchaseNotification?: {
    purchaseToken: string
    orderId: string
  }
}

// Tipos de notificação de assinatura
export const SUBSCRIPTION_NOTIFICATION_TYPES = {
  1: "RECOVERED", // Assinatura recuperada
  2: "RENEWED", // Renovada
  3: "CANCELED", // Cancelada
  4: "PURCHASED", // Comprada
  5: "ON_HOLD", // Em espera
  6: "IN_GRACE_PERIOD", // Em período de carência
  7: "RESTARTED", // Reiniciada
  8: "PRICE_CHANGE_CONFIRMED", // Mudança de preço confirmada
  9: "DEFERRED", // Adiada
  13: "PAUSED", // Pausada
  12: "PAUSE_SCHEDULE_CHANGED", // Mudança de pausa agendada
  10: "REVOKED", // Revogada
  11: "EXPIRED", // Expirada
} as const
