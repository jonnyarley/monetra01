import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { FamilyRole } from "@prisma/client"

// GET - Listar famílias do usuário
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    // Buscar famílias onde o usuário é dono ou membro
    const ownedFamilies = await db.family.findMany({
      where: { ownerId: decoded.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    })

    const memberFamilies = await db.family.findMany({
      where: {
        members: {
          some: { userId: decoded.id }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json({
      ownedFamilies,
      memberFamilies
    })
  } catch (error) {
    console.error("Erro ao buscar famílias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova família
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Criar família e adicionar criador como OWNER
    const family = await db.family.create({
      data: {
        name,
        description,
        ownerId: decoded.id,
        members: {
          create: {
            userId: decoded.id,
            role: FamilyRole.OWNER
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    })

    return NextResponse.json(family, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar família:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar família
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const body = await request.json()
    const { id, name, description } = body

    // Verificar se o usuário é dono ou admin da família
    const member = await db.familyMember.findFirst({
      where: {
        familyId: id,
        userId: decoded.id,
        role: { in: [FamilyRole.OWNER, FamilyRole.ADMIN] }
      }
    })

    if (!member) {
      return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 })
    }

    const family = await db.family.update({
      where: { id },
      data: { name, description }
    })

    return NextResponse.json(family)
  } catch (error) {
    console.error("Erro ao atualizar família:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remover família
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
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    // Verificar se o usuário é dono da família
    const family = await db.family.findFirst({
      where: { id, ownerId: decoded.id }
    })

    if (!family) {
      return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 })
    }

    await db.family.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar família:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
