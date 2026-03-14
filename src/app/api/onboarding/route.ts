import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

// GET - Verificar progresso do onboarding
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        onboardingProgress: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Se não tem progresso, criar registro inicial
    if (!user.onboardingProgress) {
      const progress = await db.onboardingProgress.create({
        data: {
          userId: user.id,
          currentStep: 0,
          totalSteps: 7,
          completedSteps: "[]"
        }
      })
      
      return NextResponse.json({
        hasOnboarding: true,
        progress
      })
    }

    return NextResponse.json({
      hasOnboarding: !user.onboardingProgress.completedAt,
      progress: user.onboardingProgress
    })
  } catch (error) {
    console.error("Erro ao verificar onboarding:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Atualizar progresso do onboarding
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const user = await db.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { currentStep, completedSteps, completed } = body

    // Atualizar ou criar progresso
    const progress = await db.onboardingProgress.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currentStep: currentStep || 0,
        totalSteps: 7,
        completedSteps: JSON.stringify(completedSteps || []),
        completedAt: completed ? new Date() : null
      },
      update: {
        currentStep: currentStep,
        completedSteps: JSON.stringify(completedSteps || []),
        completedAt: completed ? new Date() : null
      }
    })

    // Se completou o onboarding, dar pontos de bonificação
    if (completed) {
      await db.user.update({
        where: { id: user.id },
        data: {
          totalPoints: { increment: 100 },
          financialScore: { increment: 10 }
        }
      })
    }

    return NextResponse.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error("Erro ao atualizar onboarding:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Resetar onboarding (para teste)
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const user = await db.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    await db.onboardingProgress.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao resetar onboarding:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
