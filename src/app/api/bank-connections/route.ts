import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const connections = await db.bankConnection.findMany({
      where: { userId: decoded.id },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        status: true,
        lastSync: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error("Error fetching bank connections:", error)
    return NextResponse.json({ error: "Erro ao buscar conexões" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    const decoded = verify(token, jwtSecret) as { id: string }

    const { bankCode, bankName } = await request.json()

    if (!bankCode || !bankName) {
      return NextResponse.json({ error: "Dados do banco são obrigatórios" }, { status: 400 })
    }

    // Verificar se já existe conexão com este banco
    const existingConnection = await db.bankConnection.findFirst({
      where: { 
        userId: decoded.id,
        bankCode: bankCode,
      },
    })

    if (existingConnection) {
      return NextResponse.json({ 
        error: "Este banco já está conectado",
        connection: existingConnection,
      }, { status: 400 })
    }

    // Criar conexão (em produção, aqui seria feita a integração OAuth com Open Banking)
    const connection = await db.bankConnection.create({
      data: {
        userId: decoded.id,
        bankCode,
        bankName,
        connectionId: `conn_${Date.now()}`,
        status: "ACTIVE",
        lastSync: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      connection: {
        id: connection.id,
        bankName: connection.bankName,
        bankCode: connection.bankCode,
        status: connection.status,
        lastSync: connection.lastSync,
      },
    })
  } catch (error) {
    console.error("Error creating bank connection:", error)
    return NextResponse.json({ error: "Erro ao criar conexão" }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: "ID da conexão é obrigatório" }, { status: 400 })
    }

    await db.bankConnection.delete({
      where: { 
        id,
        userId: decoded.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bank connection:", error)
    return NextResponse.json({ error: "Erro ao excluir conexão" }, { status: 500 })
  }
}
