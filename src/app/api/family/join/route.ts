import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { FamilyRole } from "@prisma/client"

// POST - Aceitar convite por link (familyId)
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
    const { familyId } = body

    if (!familyId) {
      return NextResponse.json({ error: "familyId é obrigatório" }, { status: 400 })
    }

    // Verificar se a família existe
    const family = await db.family.findUnique({
      where: { id: familyId }
    })

    if (!family) {
      return NextResponse.json({ error: "Família não encontrada" }, { status: 404 })
    }

    // Verificar se já é membro
    const existingMember = await db.familyMember.findFirst({
      where: {
        familyId,
        userId: decoded.id
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: "Você já é membro desta família" }, { status: 400 })
    }

    // Adicionar como membro
    const newMember = await db.familyMember.create({
      data: {
        familyId,
        userId: decoded.id,
        role: FamilyRole.MEMBER
      },
      include: {
        family: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Você entrou na família "${family.name}"!`,
      family: newMember.family
    })
  } catch (error) {
    console.error("Erro ao entrar na família:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Sair da família
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get("familyId")

    if (!familyId) {
      return NextResponse.json({ error: "familyId é obrigatório" }, { status: 400 })
    }

    // Verificar se é owner (não pode sair, precisa transferir ou excluir)
    const family = await db.family.findUnique({
      where: { id: familyId }
    })

    if (family?.ownerId === decoded.id) {
      return NextResponse.json({
        error: "O proprietário não pode sair da família. Transfira a propriedade ou exclua a família."
      }, { status: 400 })
    }

    // Remover membro
    await db.familyMember.deleteMany({
      where: {
        familyId,
        userId: decoded.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Você saiu da família"
    })
  } catch (error) {
    console.error("Erro ao sair da família:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
