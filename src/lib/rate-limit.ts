import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

// Singleton pattern para Rate Limiters
let redis: Redis | null = null
let rateLimiters: Map<string, Ratelimit> = new Map()

function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn("⚠️ Upstash Redis não configurado - rate limiting desabilitado")
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// Configurações de rate limiting
export const RATE_LIMIT_CONFIGS = {
  // APIs de autenticação - mais restritivo
  AUTH: {
    requests: 5,
    window: "60s", // 5 requisições por minuto
    message: "Muitas tentativas. Aguarde um momento e tente novamente.",
  },
  // APIs de escrita - moderado
  WRITE: {
    requests: 30,
    window: "60s", // 30 requisições por minuto
    message: "Você está fazendo muitas alterações. Aguarde um momento.",
  },
  // APIs de leitura - mais permissivo
  READ: {
    requests: 100,
    window: "60s", // 100 requisições por minuto
    message: "Muitas requisições. Aguarde um momento.",
  },
  // APIs de IA - mais restritivo (custo)
  AI: {
    requests: 20,
    window: "60s", // 20 requisições por minuto
    message: "Limite de requisições à IA atingido. Aguarde um momento.",
  },
  // APIs de exportação - muito restritivo
  EXPORT: {
    requests: 5,
    window: "300s", // 5 requisições por 5 minutos
    message: "Muitas exportações. Aguarde antes de exportar novamente.",
  },
} as const

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Obtém ou cria um rate limiter
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const client = getRedisClient()

  if (!client) return null

  const existing = rateLimiters.get(type)
  if (existing) return existing

  const config = RATE_LIMIT_CONFIGS[type]
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as `${number}s`),
    analytics: true,
    prefix: `ratelimit:${type.toLowerCase()}`,
  })

  rateLimiters.set(type, limiter)
  return limiter
}

/**
 * Extrai o identificador do cliente (IP ou ID do usuário)
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Se tem userId, usa ele (mais preciso)
  if (userId) return `user:${userId}`

  // Tenta pegar o IP real (atrás de proxy)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`
  }

  // Fallback para IP direto
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return `ip:${realIp}`

  // Último recurso
  return `ip:unknown:${Date.now()}`
}

/**
 * Middleware de rate limiting
 * @returns NextResponse se bloqueado, null se liberado
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(type)

  // Se não tem Redis, permite tudo
  if (!limiter) return null

  const identifier = getClientIdentifier(request, userId)
  const config = RATE_LIMIT_CONFIGS[type]

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    if (!success) {
      console.log(`🚫 Rate limit bloqueado: ${identifier} (${type})`)

      return NextResponse.json(
        {
          error: config.message,
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Log de sucesso (apenas para debug)
    if (remaining < 10) {
      console.log(`⚠️ Rate limit baixo: ${identifier} (${remaining} restantes)`)
    }

    return null // Liberado
  } catch (error) {
    console.error("Erro no rate limiting:", error)
    // Em caso de erro, permite a requisição
    return null
  }
}

/**
 * Wrapper para proteger APIs com rate limiting
 */
export function withRateLimit(
  type: RateLimitType,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    // Verifica rate limit
    const rateLimitResponse = await checkRateLimit(request, type)
    if (rateLimitResponse) return rateLimitResponse

    // Executa o handler
    return handler(request, context)
  }
}

/**
 * Adiciona headers de rate limit na resposta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString())
  response.headers.set("X-RateLimit-Remaining", remaining.toString())
  response.headers.set("X-RateLimit-Reset", reset.toString())
  return response
}
