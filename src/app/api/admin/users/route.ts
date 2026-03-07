import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getAdminJwtSecret } from "@/lib/jwt-secret"

// GET - Listar todos os usuários com paginação
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const jwtSecret = getAdminJwtSecret()
    const decoded = verify(adminToken, jwtSecret) as { role?: string }
    
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const planFilter = searchParams.get("plan") || ""

    const skip = (page - 1) * limit

    // Construir filtros
    const where: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>
      plan?: string
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (planFilter && planFilter !== "all") {
      where.plan = planFilter
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          subscriptionEnd: true,
          createdAt: true,
          lastLoginAt: true,
          financialScore: true,
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        status: user.subscriptionStatus?.toLowerCase() || "active"
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Admin users list error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do usuário
export async function PATCH(request: NextRequest) {
  try {
    console.log("=== ADMIN USER UPDATE ===")
    
    // Verificar se é admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken) {
      console.log("ERRO: Sem token admin")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const jwtSecret = getAdminJwtSecret()
    const decoded = verify(adminToken, jwtSecret) as { role?: string }
    
    if (decoded.role !== "admin") {
      console.log("ERRO: Role não é admin")
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, action, plan } = body

    console.log("Dados recebidos:", { userId, action, plan })

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário antes de atualizar
    const userBefore = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, plan: true, subscriptionStatus: true }
    })

    if (!userBefore) {
      console.log("ERRO: Usuário não encontrado:", userId)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    console.log("Usuário encontrado:", userBefore)

    let updateData: {
      plan?: string
      subscriptionStatus?: string
      subscriptionEnd?: Date | null
    } = {}

    switch (action) {
      case "activate":
        updateData.subscriptionStatus = "ACTIVE"
        break
      case "suspend":
        updateData.subscriptionStatus = "CANCELED"
        updateData.subscriptionEnd = null
        break
      case "upgrade":
        // Aceitar BASIC, PRO e BUSINESS
        if (plan && ["BASIC", "PRO", "BUSINESS"].includes(plan)) {
          updateData.plan = plan
          updateData.subscriptionStatus = "ACTIVE"
          // Definir data de expiração para 1 ano (manual admin)
          const endDate = new Date()
          endDate.setFullYear(endDate.getFullYear() + 1)
          updateData.subscriptionEnd = endDate
          console.log("Upgrade para:", plan, "Expira em:", endDate)
        } else {
          console.log("ERRO: Plano inválido:", plan)
          return NextResponse.json(
            { error: "Plano inválido. Use BASIC, PRO ou BUSINESS" },
            { status: 400 }
          )
        }
        break
      case "downgrade":
        updateData.plan = "FREE"
        updateData.subscriptionStatus = "CANCELED"
        break
      default:
        return NextResponse.json(
          { error: "Ação inválida" },
          { status: 400 }
        )
    }

    console.log("Dados para atualização:", updateData)

    // Atualizar usuário
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    })

    console.log("Usuário atualizado com sucesso:", updatedUser)

    // Tentar criar log de auditoria (pode falhar se tabela não existir)
    try {
      await db.auditLog.create({
        data: {
          userId,
          action: `ADMIN_${action.toUpperCase()}`,
          entity: "user",
          entityId: userId,
          oldData: JSON.stringify(userBefore),
          newData: JSON.stringify(updateData),
        }
      })
    } catch (auditError) {
      console.log("Aviso: Não foi possível criar log de auditoria:", auditError)
    }

    return NextResponse.json({
      success: true,
      message: `Usuário atualizado para ${plan || action}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    })

  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário: " + (error as Error).message },
      { status: 500 }
    )
  }
}
