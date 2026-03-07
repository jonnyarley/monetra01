import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getAdminJwtSecret } from "@/lib/jwt-secret"

// GET - Buscar dados do dashboard admin
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

    // Buscar estatísticas reais do banco
    const [
      totalUsers,
      activeSubscriptions,
      usersByPlan,
      recentUsers,
      recentAuditLogs
    ] = await Promise.all([
      // Total de usuários
      db.user.count(),
      
      // Assinaturas ativas
      db.user.count({
        where: {
          subscriptionStatus: "ACTIVE",
          subscriptionEnd: { gte: new Date() }
        }
      }),
      
      // Usuários por plano
      db.user.groupBy({
        by: ['plan'],
        _count: { id: true }
      }),
      
      // Usuários recentes
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          createdAt: true,
        }
      }),
      
      // Logs de auditoria recentes (transações/assinaturas)
      db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          action: { contains: 'SUBSCRIPTION' }
        },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          newData: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ])

    // Calcular distribuição de planos
    const planDistribution = {
      FREE: 0,
      PRO: 0,
      BUSINESS: 0
    }
    
    usersByPlan.forEach(item => {
      planDistribution[item.plan] = item._count.id
    })

    // Calcular receita mensal estimada
    const monthlyRevenue = 
      (planDistribution.PRO * 19.90) + 
      (planDistribution.BUSINESS * 49.90)

    // Calcular taxa de churn (usuários que cancelaram no último mês)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const canceledThisMonth = await db.user.count({
      where: {
        subscriptionStatus: "CANCELED",
        updatedAt: { gte: lastMonth }
      }
    })
    
    const churnRate = totalUsers > 0 
      ? ((canceledThisMonth / totalUsers) * 100).toFixed(1)
      : "0"

    // Formatar usuários recentes
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name || "Sem nome",
      email: user.email,
      plan: user.plan,
      status: user.subscriptionStatus?.toLowerCase() || "active",
      date: user.createdAt.toISOString().split('T')[0]
    }))

    // Formatar transações recentes
    const formattedTransactions = recentAuditLogs.map(log => {
      let data: { productId?: string; plan?: string; amount?: number } = {}
      try {
        data = JSON.parse(log.newData || '{}')
      } catch {
        data = {}
      }
      
      return {
        id: log.id,
        user: log.user?.name || "Usuário",
        email: log.user?.email || "",
        plan: data.plan || "N/A",
        amount: data.plan === "BUSINESS" ? 49.90 : data.plan === "PRO" ? 19.90 : 0,
        date: log.createdAt.toISOString().replace('T', ' ').slice(0, 16)
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        activeSubscriptions,
        churnRate
      },
      planDistribution: {
        FREE: planDistribution.FREE,
        PRO: planDistribution.PRO,
        BUSINESS: planDistribution.BUSINESS,
        total: totalUsers
      },
      recentUsers: formattedRecentUsers,
      recentTransactions: formattedTransactions
    })

  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar dados" },
      { status: 500 }
    )
  }
}
