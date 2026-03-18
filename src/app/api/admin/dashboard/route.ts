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

    // Buscar dados do banco com tratamento de erro
    let totalUsers = 0
    let activeSubscriptions = 0
    let usersByPlan: { plan: string; _count: { id: number } }[] = []
    let recentUsers: any[] = []

    try {
      totalUsers = await db.user.count()
    } catch (e) {
      console.log("Erro ao contar usuários:", e)
    }

    try {
      activeSubscriptions = await db.user.count({
        where: {
          subscriptionStatus: "ACTIVE",
          subscriptionEnd: { gte: new Date() }
        }
      })
    } catch (e) {
      console.log("Erro ao contar assinaturas:", e)
    }

    try {
      usersByPlan = await db.user.groupBy({
        by: ['plan'],
        _count: { id: true }
      })
    } catch (e) {
      console.log("Erro ao agrupar por plano:", e)
    }

    try {
      recentUsers = await db.user.findMany({
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
      })
    } catch (e) {
      console.log("Erro ao buscar usuários recentes:", e)
    }

    // Calcular distribuição de planos
    const planDistribution = {
      FREE: 0,
      BASIC: 0,
      PRO: 0,
      BUSINESS: 0,
      total: totalUsers
    }
    
    usersByPlan.forEach(item => {
      planDistribution[item.plan as keyof typeof planDistribution] = item._count.id
    })

    // Calcular receita mensal estimada
    const monthlyRevenue = 
      (planDistribution.BASIC * 14.90) + 
      (planDistribution.PRO * 24.90) + 
      (planDistribution.BUSINESS * 49.90)

    // Calcular taxa de churn
    let churnRate = "0"
    try {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const canceledThisMonth = await db.user.count({
        where: {
          subscriptionStatus: "CANCELED",
          updatedAt: { gte: lastMonth }
        }
      })
      
      churnRate = totalUsers > 0 
        ? ((canceledThisMonth / totalUsers) * 100).toFixed(1)
        : "0"
    } catch (e) {
      console.log("Erro ao calcular churn:", e)
    }

    // Formatar usuários recentes
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name || "Sem nome",
      email: user.email,
      plan: user.plan || "FREE",
      status: user.subscriptionStatus?.toLowerCase() || "active",
      date: user.createdAt?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
    }))

    // Se não houver usuários, adicionar dados de exemplo
    if (formattedRecentUsers.length === 0) {
      formattedRecentUsers.push({
        id: "1",
        name: "Admin",
        email: "jonnyarley379@gmail.com",
        plan: "BUSINESS",
        status: "active",
        date: new Date().toISOString().split('T')[0]
      })
    }

    // Buscar transações recentes (logs de auditoria)
    let recentTransactions: any[] = []
    try {
      const auditLogs = await db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          action: { contains: 'SUBSCRIPTION' }
        },
        select: {
          id: true,
          action: true,
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

      recentTransactions = auditLogs.map(log => {
        let data: { plan?: string } = {}
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
          amount: data.plan === "BUSINESS" ? 49.90 : data.plan === "PRO" ? 24.90 : data.plan === "BASIC" ? 14.90 : 0,
          date: log.createdAt?.toISOString?.()?.replace('T', ' ')?.slice(0, 16) || ""
        }
      })
    } catch (e) {
      console.log("Erro ao buscar logs de auditoria:", e)
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        activeSubscriptions,
        churnRate
      },
      planDistribution,
      recentUsers: formattedRecentUsers,
      recentTransactions
    })

  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar dados" },
      { status: 500 }
    )
  }
}
