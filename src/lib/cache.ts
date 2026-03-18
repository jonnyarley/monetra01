import { Redis } from "@upstash/redis"

// Singleton pattern para Redis client
let redis: Redis | null = null

export function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn("⚠️ Upstash Redis não configurado - cache desabilitado")
    return null
  }

  redis = new Redis({
    url,
    token,
  })

  return redis
}

// Tipos para o cache
interface CacheOptions {
  ttl?: number // Tempo de vida em segundos (padrão: 5 minutos)
  prefix?: string // Prefixo para organizar keys
}

const DEFAULT_TTL = 300 // 5 minutos
const DEFAULT_PREFIX = "monetra"

/**
 * Busca dados do cache ou executa a função e salva no cache
 * @param key Chave única para o cache
 * @param fn Função que retorna os dados se não estiverem em cache
 * @param options Opções de TTL e prefixo
 */
export async function cacheOrFetch<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const client = getRedisClient()
  const { ttl = DEFAULT_TTL, prefix = DEFAULT_PREFIX } = options
  const cacheKey = `${prefix}:${key}`

  // Se não tem Redis, executa a função diretamente
  if (!client) {
    return fn()
  }

  try {
    // Tenta buscar do cache
    const cached = await client.get<T>(cacheKey)

    if (cached !== null) {
      console.log(`✅ Cache HIT: ${cacheKey}`)
      return cached
    }

    console.log(`❌ Cache MISS: ${cacheKey}`)

    // Executa a função e salva no cache
    const data = await fn()
    await client.setex(cacheKey, ttl, JSON.stringify(data))

    return data
  } catch (error) {
    console.error("Erro no cache Redis:", error)
    // Em caso de erro, executa a função sem cache
    return fn()
  }
}

/**
 * Invalida um cache específico
 */
export async function invalidateCache(
  key: string,
  prefix: string = DEFAULT_PREFIX
): Promise<void> {
  const client = getRedisClient()

  if (!client) return

  try {
    await client.del(`${prefix}:${key}`)
    console.log(`🗑️ Cache invalidated: ${prefix}:${key}`)
  } catch (error) {
    console.error("Erro ao invalidar cache:", error)
  }
}

/**
 * Invalida múltiplos caches por padrão
 */
export async function invalidateCachePattern(
  pattern: string,
  prefix: string = DEFAULT_PREFIX
): Promise<void> {
  const client = getRedisClient()

  if (!client) return

  try {
    // Busca todas as keys que match o padrão
    const keys = await client.keys(`${prefix}:${pattern}*`)

    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`🗑️ Cache invalidated: ${keys.length} keys`)
    }
  } catch (error) {
    console.error("Erro ao invalidar cache por padrão:", error)
  }
}

/**
 * Invalida todo o cache de um usuário
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCachePattern(`user:${userId}`)
}

/**
 * Invalida cache relacionado a transações de um usuário
 */
export async function invalidateTransactionCache(userId: string): Promise<void> {
  const patterns = [
    `user:${userId}:dashboard`,
    `user:${userId}:transactions`,
    `user:${userId}:reports`,
    `user:${userId}:summary`,
    `user:${userId}:balance`,
  ]

  for (const pattern of patterns) {
    await invalidateCache(pattern)
  }
}

// TTLs pré-definidos para diferentes tipos de dados
export const CACHE_TTL = {
  SHORT: 60, // 1 minuto - dados que mudam frequentemente
  MEDIUM: 300, // 5 minutos - dados moderados
  LONG: 900, // 15 minutos - dados que mudam pouco
  VERY_LONG: 3600, // 1 hora - dados estáticos
} as const
