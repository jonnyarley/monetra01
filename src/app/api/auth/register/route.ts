import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

// Rate limiting store
const registerAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 60000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = registerAttempts.get(ip)
  
  if (!attempts) {
    registerAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    registerAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  if (attempts.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos")
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        plan: "FREE",
        financialScore: 0,
        totalPoints: 0,
        level: 1,
        trialEndsAt,
        trialUsed: true
      }
    })

    // Create default categories for user
    const defaultCategories = [
      { name: "Salário", type: "INCOME", icon: "wallet", color: "#22c55e", isDefault: true },
      { name: "Alimentação", type: "EXPENSE", icon: "utensils", color: "#f97316", isDefault: true },
      { name: "Transporte", type: "EXPENSE", icon: "car", color: "#3b82f6", isDefault: true },
      { name: "Moradia", type: "EXPENSE", icon: "home", color: "#8b5cf6", isDefault: true },
      { name: "Lazer", type: "EXPENSE", icon: "gamepad", color: "#ec4899", isDefault: true },
      { name: "Saúde", type: "EXPENSE", icon: "heart", color: "#ef4444", isDefault: true },
      { name: "Educação", type: "EXPENSE", icon: "book", color: "#06b6d4", isDefault: true },
      { name: "Compras", type: "EXPENSE", icon: "shopping-bag", color: "#f59e0b", isDefault: true },
    ]

    await db.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id
      }))
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    })

  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao criar conta" },
      { status: 500 }
    )
  }
}
