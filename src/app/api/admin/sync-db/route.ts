import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getAdminJwtSecret } from "@/lib/jwt-secret"
import { PrismaClient } from "@prisma/client"

// POST - Sincronizar banco de dados (criar tabelas faltantes)
export async function POST(request: NextRequest) {
  console.log("[SYNC-DB] Iniciando sincronização do banco...")
  
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken) {
      return NextResponse.json({ error: "Não autorizado - faça login como admin" }, { status: 401 })
    }

    const jwtSecret = getAdminJwtSecret()
    let decoded: any
    
    try {
      decoded = verify(adminToken, jwtSecret)
    } catch (e) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Executar raw SQL para criar tabelas faltantes
    const results: string[] = []

    // 1. Criar tabela user_achievements se não existir
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "user_achievements" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "achievementId" TEXT NOT NULL,
          "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
        )
      `)
      results.push("✓ Tabela user_achievements criada/verificada")
    } catch (e) {
      results.push(`⚠ user_achievements: ${String(e)}`)
    }

    // 2. Criar tabela achievements se não existir
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "achievements" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "icon" TEXT NOT NULL,
          "points" INTEGER NOT NULL,
          "category" TEXT NOT NULL,
          CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
        )
      `)
      results.push("✓ Tabela achievements criada/verificada")
    } catch (e) {
      results.push(`⚠ achievements: ${String(e)}`)
    }

    // 3. Criar tabela bank_connections se não existir
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "bank_connections" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "bankName" TEXT NOT NULL,
          "bankCode" TEXT NOT NULL,
          "connectionId" TEXT NOT NULL,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "lastSync" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
        )
      `)
      results.push("✓ Tabela bank_connections criada/verificada")
    } catch (e) {
      results.push(`⚠ bank_connections: ${String(e)}`)
    }

    // 4. Criar índices
    try {
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "user_achievements_userId_idx" ON "user_achievements"("userId")`)
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "user_achievements_achievementId_idx" ON "user_achievements"("achievementId")`)
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId")`)
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "achievements_category_idx" ON "achievements"("category")`)
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bank_connections_userId_idx" ON "bank_connections"("userId")`)
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bank_connections_userId_status_idx" ON "bank_connections"("userId", "status")`)
      results.push("✓ Índices criados/verificados")
    } catch (e) {
      results.push(`⚠ índices: ${String(e)}`)
    }

    // 5. Adicionar foreign keys
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_achievements_userId_fkey'
          ) THEN
            ALTER TABLE "user_achievements" 
            ADD CONSTRAINT "user_achievements_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)
      results.push("✓ Foreign key user_achievements -> users criada")
    } catch (e) {
      results.push(`⚠ FK user_achievements: ${String(e)}`)
    }

    // 6. Corrigir categorias com updatedAt nulo
    try {
      const result = await db.$executeRawUnsafe(`
        UPDATE "categories" 
        SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
        WHERE "updatedAt" IS NULL
      `)
      results.push(`✓ ${result} categorias corrigidas (updatedAt)`)
    } catch (e) {
      results.push(`⚠ categorias updatedAt: ${String(e)}`)
    }

    // 7. Verificar se as tabelas principais existem
    const tableChecks: Record<string, boolean> = {}
    
    try {
      await db.$queryRaw`SELECT 1 FROM "users" LIMIT 1`
      tableChecks.users = true
    } catch { tableChecks.users = false }

    try {
      await db.$queryRaw`SELECT 1 FROM "transactions" LIMIT 1`
      tableChecks.transactions = true
    } catch { tableChecks.transactions = false }

    try {
      await db.$queryRaw`SELECT 1 FROM "categories" LIMIT 1`
      tableChecks.categories = true
    } catch { tableChecks.categories = false }

    try {
      await db.$queryRaw`SELECT 1 FROM "user_achievements" LIMIT 1`
      tableChecks.user_achievements = true
    } catch { tableChecks.user_achievements = false }

    try {
      await db.$queryRaw`SELECT 1 FROM "bank_connections" LIMIT 1`
      tableChecks.bank_connections = true
    } catch { tableChecks.bank_connections = false }

    console.log("[SYNC-DB] Sincronização concluída!")

    return NextResponse.json({
      success: true,
      message: "Sincronização concluída!",
      results,
      tables: tableChecks
    })

  } catch (error) {
    console.error("[SYNC-DB] Erro:", error)
    return NextResponse.json({ 
      error: "Erro ao sincronizar banco", 
      details: String(error) 
    }, { status: 500 })
  }
}

// GET - Verificar status das tabelas
export async function GET(request: NextRequest) {
  const tables = ["users", "transactions", "categories", "user_achievements", "bank_connections", "cards", "financial_accounts", "goals", "budgets"]
  const status: Record<string, boolean> = {}

  for (const table of tables) {
    try {
      await db.$executeRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
      status[table] = true
    } catch {
      status[table] = false
    }
  }

  return NextResponse.json({
    message: "Status das tabelas do banco",
    tables: status
  })
}
