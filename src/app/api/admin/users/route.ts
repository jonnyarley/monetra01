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

// PATCH - Atualizar status/plano do usuário
export async function PATCH(request: NextRequest) {
  try {
    console.log("=== ADMIN USER UPDATE INICIADO ===")
    
    // Verificar se é admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken) {
      console.log("ERRO: Sem token admin")
      return NextResponse.json(
        { error: "Não autorizado - faça login novamente" },
        { status: 401 }
      )
    }

    let decoded
    try {
      const jwtSecret = getAdminJwtSecret()
      decoded = verify(adminToken, jwtSecret) as { role?: string }
    } catch (jwtError) {
      console.log("ERRO: Token inválido", jwtError)
      return NextResponse.json(
        { error: "Token expirado - faça login novamente" },
        { status: 401 }
      )
    }
    
    if (decoded.role !== "admin") {
      console.log("ERRO: Role não é admin:", decoded)
      return NextResponse.json(
        { error: "Acesso negado - você não é admin" },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log("Body recebido:", JSON.stringify(body, null, 2))
    
    const { userId, action, plan } = body

    if (!userId) {
      console.log("ERRO: userId não fornecido")
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário antes de atualizar
    let userBefore
    try {
      userBefore = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, plan: true, subscriptionStatus: true }
      })
    } catch (dbError) {
      console.log("ERRO ao buscar usuário:", dbError)
      return NextResponse.json(
        { error: "Erro ao buscar usuário no banco" },
        { status: 500 }
      )
    }

    if (!userBefore) {
      console.log("ERRO: Usuário não encontrado:", userId)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    console.log("Usuário encontrado:", userBefore)

    // Preparar dados de atualização
    const updateData: {
      plan?: string
      subscriptionStatus?: string
      subscriptionEnd?: Date
    } = {}

    switch (action) {
      case "activate":
        updateData.subscriptionStatus = "ACTIVE"
        console.log("Ação: ativar usuário")
        break
        
      case "suspend":
        updateData.subscriptionStatus = "CANCELED"
        updateData.subscriptionEnd = new Date()
        console.log("Ação: suspender usuário")
        break
        
      case "upgrade":
        if (!plan) {
          return NextResponse.json(
            { error: "Plano não especificado para upgrade" },
            { status: 400 }
          )
        }
        
        const validPlans = ["BASIC", "PRO", "BUSINESS"]
        if (!validPlans.includes(plan)) {
          console.log("ERRO: Plano inválido:", plan)
          return NextResponse.json(
            { error: `Plano inválido: ${plan}. Use: ${validPlans.join(", ")}` },
            { status: 400 }
          )
        }
        
        updateData.plan = plan
        updateData.subscriptionStatus = "ACTIVE"
        // Assinatura válida por 1 ano (manual admin)
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)
        updateData.subscriptionEnd = endDate
        
        console.log(`Ação: upgrade para ${plan}, válido até ${endDate.toISOString()}`)
        break
        
      case "downgrade":
        updateData.plan = "FREE"
        updateData.subscriptionStatus = "CANCELED"
        console.log("Ação: downgrade para FREE")
        break
        
      default:
        console.log("ERRO: Ação inválida:", action)
        return NextResponse.json(
          { error: `Ação inválida: ${action}` },
          { status: 400 }
        )
    }

    console.log("Dados para atualização:", updateData)

    // Atualizar usuário
    let updatedUser
    try {
      updatedUser = await db.user.update({
        where: { id: userId },
        data: updateData
      })
      console.log("Usuário atualizado com sucesso!")
    } catch (updateError) {
      console.log("ERRO ao atualizar:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar usuário no banco: " + (updateError as Error).message },
        { status: 500 }
      )
    }

    // Tentar criar log de auditoria (não bloqueia se falhar)
    try {
      await db.auditLog.create({
        data: {
          userId: userId,
          action: `ADMIN_${action.toUpperCase()}`,
          entity: "user",
          entityId: userId,
          oldData: JSON.stringify(userBefore),
          newData: JSON.stringify(updateData),
        }
      })
      console.log("Log de auditoria criado")
    } catch (auditError) {
      console.log("Aviso: Não foi possível criar log de auditoria (tabela pode não existir)")
    }

    return NextResponse.json({
      success: true,
      message: action === "upgrade" 
        ? `Plano atualizado para ${plan} com sucesso!` 
        : `Ação '${action}' executada com sucesso!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEnd: updatedUser.subscriptionEnd
      }
    })

  } catch (error) {
    console.error("=== ERRO GERAL ===", error)
    return NextResponse.json(
      { error: "Erro interno: " + (error as Error).message },
      { status: 500 }
    )
  }
}
