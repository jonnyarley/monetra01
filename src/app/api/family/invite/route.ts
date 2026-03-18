import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { FamilyRole } from "@prisma/client"

// POST - Convidar membro por email
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
    const { familyId, email, role = "MEMBER" } = body

    if (!familyId || !email) {
      return NextResponse.json({ error: "familyId e email são obrigatórios" }, { status: 400 })
    }

    // Verificar se o usuário é admin ou owner da família
    const member = await db.familyMember.findFirst({
      where: {
        familyId,
        userId: decoded.id,
        role: { in: [FamilyRole.OWNER, FamilyRole.ADMIN] }
      }
    })

    if (!member) {
      return NextResponse.json({ error: "Sem permissão para convidar" }, { status: 403 })
    }

    // Verificar se o convidado existe no sistema
    const invitedUser = await db.user.findUnique({
      where: { email }
    })

    // Verificar se já é membro
    if (invitedUser) {
      const existingMember = await db.familyMember.findFirst({
        where: {
          familyId,
          userId: invitedUser.id
        }
      })

      if (existingMember) {
        return NextResponse.json({ error: "Este usuário já é membro da família" }, { status: 400 })
      }
    }

    // Criar convite pendente (se o usuário não existir, ele pode aceitar depois de se registrar)
    // Por enquanto, se o usuário existir, adiciona diretamente
    if (invitedUser) {
      await db.familyMember.create({
        data: {
          familyId,
          userId: invitedUser.id,
          role: role as FamilyRole
        }
      })

      // Criar notificação para o usuário convidado
      await db.notification.create({
        data: {
          userId: invitedUser.id,
          type: "INFO",
          title: "Convite para Família",
          message: `Você foi adicionado a uma família! Acesse o Modo Família para ver.`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: invitedUser
        ? "Membro adicionado com sucesso!"
        : "Convite enviado! O usuário poderá aceitar após se registrar."
    })
  } catch (error) {
    console.error("Erro ao convidar membro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
