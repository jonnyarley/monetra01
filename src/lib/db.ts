// Prisma Client - Database connection
// Updated to support Budget-Category relation
// v2: Force reload after relation fix
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new client to pick up schema changes
export const db = new PrismaClient({
  log: ['query'],
})

// Alias for backward compatibility
export const prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db