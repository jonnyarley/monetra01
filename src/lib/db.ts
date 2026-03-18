// Prisma Client - Database connection
// Optimized for Serverless (Vercel + Neon)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração otimizada para serverless
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configurações de connection pooling para serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Singleton pattern para evitar múltiplas conexões em development
// Em serverless (Vercel), cada função cria sua própria instância
export const db = globalForPrisma.prisma ?? createPrismaClient()

// Em development, salva no global para evitar múltiplas conexões
// Em production (serverless), não usa global
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Alias for backward compatibility
export const prisma = db

// Graceful shutdown (importante para serverless)
if (process.env.NODE_ENV === 'production') {
  // Fecha conexões quando a função terminar
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
