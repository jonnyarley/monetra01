import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { z } from "zod"
import { getJwtSecret } from "@/lib/jwt-secret"

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  budget: z.number().optional(),
})

// GET - Listar categorias do usuário
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Primeiro, corrigir categorias com updatedAt nulo
    try {
      await db.$executeRawUnsafe(`
        UPDATE "categories" 
        SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
        WHERE "updatedAt" IS NULL
      `)
    } catch (fixError) {
      console.log("Fix categories error:", fixError)
    }

    const categories = await db.category.findMany({
      where: {
        OR: [
          { userId: decoded.id },
          { isDefault: true }
        ]
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" }
      ],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Erro ao carregar categorias" }, { status: 500 })
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const result = createCategorySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.flatten() }, { status: 400 })
    }

    const { name, type, icon, color, budget } = result.data

    // Verificar se já existe
    const existing = await db.category.findFirst({
      where: { userId: decoded.id, name, type }
    })

    if (existing) {
      return NextResponse.json({ error: "Categoria já existe" }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        userId: decoded.id,
        name,
        type,
        icon: icon || null,
        color: color || null,
        budget: budget || null,
        isDefault: false,
      }
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
