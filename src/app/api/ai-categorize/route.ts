import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import ZAI from "z-ai-web-dev-sdk"

// Categorias disponíveis para classificação
const AVAILABLE_CATEGORIES = [
  { name: "Alimentação", keywords: ["restaurante", "ifood", "uber eats", "rappi", "lanchonete", "padaria", "mercado", "supermercado", "café", "pizza", "hamburguer"] },
  { name: "Transporte", keywords: ["uber", "99", "taxi", "posto", "gasolina", "shell", "petrobras", "ipiranga", "metro", "onibus", "estacionamento"] },
  { name: "Moradia", keywords: ["aluguel", "condominio", "iptu", "energia", "agua", "gas", "internet", "net", "vivo", "claro", "oi"] },
  { name: "Entretenimento", keywords: ["netflix", "spotify", "youtube", "amazon", "disney", "hbo", "cinema", "teatro", "show", "game"] },
  { name: "Saúde", keywords: ["farmacia", "drogasil", "pague menos", "hospital", "clinica", "consulta", "laboratorio", "dentista", "medico"] },
  { name: "Educação", keywords: ["escola", "faculdade", "curso", "livro", "material", "udemy", "coursera", "alura"] },
  { name: "Compras", keywords: ["amazon", "magazine", "casas bahia", "extra", "carrefour", "shopee", "mercado livre", "loja", "shopping"] },
  { name: "Salário", keywords: ["salario", "payment", "payroll", "deposito", "folha"] },
  { name: "Investimentos", keywords: ["acoes", "fiis", "tesouro", "cdb", "poupanca", "investimento", "broker", "xp", "clear"] },
  { name: "Transferência", keywords: ["pix", "transferencia", "ted", "doc"] },
  { name: "Outros", keywords: [] }
]

interface CategorizationResult {
  categoryId: string | null
  categoryName: string
  confidence: number
}

// Função para categorização baseada em regras (rápida e gratuita)
function ruleBasedCategorization(description: string): CategorizationResult {
  const desc = description.toLowerCase()
  
  for (const category of AVAILABLE_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword)) {
        return {
          categoryId: null,
          categoryName: category.name,
          confidence: 0.8
        }
      }
    }
  }
  
  return {
    categoryId: null,
    categoryName: "Outros",
    confidence: 0.3
  }
}

// Função para categorização com IA (mais precisa)
async function aiCategorization(description: string): Promise<CategorizationResult> {
  try {
    const zai = await ZAI.create()
    
    const categoryList = AVAILABLE_CATEGORIES.map(c => c.name).join(", ")
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `Você é um assistente especializado em categorização de transações financeiras. 
          
Analise a descrição da transação e retorne APENAS um JSON no formato:
{"category": "nome_da_categoria", "confidence": 0.0-1.0}

Categorias disponíveis: ${categoryList}

Regras:
- confidence deve ser entre 0 e 1
- Se não tiver certeza, use "Outros"
- Retorne APENAS o JSON, sem texto adicional`
        },
        {
          role: "user",
          content: `Categorize esta transação: "${description}"`
        }
      ],
      thinking: { type: "disabled" }
    })
    
    const response = completion.choices[0]?.message?.content || ""
    
    try {
      const parsed = JSON.parse(response)
      return {
        categoryId: null,
        categoryName: parsed.category || "Outros",
        confidence: parsed.confidence || 0.5
      }
    } catch {
      return ruleBasedCategorization(description)
    }
  } catch (error) {
    console.error("AI categorization error:", error)
    return ruleBasedCategorization(description)
  }
}

// POST - Categorizar uma ou mais transações
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
    const { transactions, useAI = false } = body

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Buscar categorias do usuário
    const categories = await db.category.findMany({
      where: { 
        OR: [
          { userId: decoded.id },
          { isDefault: true }
        ]
      }
    })

    // Categorizar cada transação
    const results = []
    for (const tx of transactions) {
      let result: CategorizationResult
      
      if (useAI) {
        result = await aiCategorization(tx.description)
      } else {
        result = ruleBasedCategorization(tx.description)
      }
      
      // Encontrar ID da categoria
      const category = categories.find(c => 
        c.name.toLowerCase().includes(result.categoryName.toLowerCase()) ||
        result.categoryName.toLowerCase().includes(c.name.toLowerCase())
      )
      
      results.push({
        transactionId: tx.id,
        description: tx.description,
        categoryId: category?.id || null,
        categoryName: result.categoryName,
        confidence: result.confidence
      })
    }

    return NextResponse.json({
      success: true,
      results,
      usedAI: useAI
    })
  } catch (error) {
    console.error("Erro ao categorizar:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Aplicar categorização a transações existentes
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
    const { transactionId, categoryId } = body

    if (!transactionId || !categoryId) {
      return NextResponse.json({ error: "ID da transação e categoria são obrigatórios" }, { status: 400 })
    }

    // Verificar se a transação pertence ao usuário
    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, userId: decoded.id }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    // Atualizar categoria
    const updated = await db.transaction.update({
      where: { id: transactionId },
      data: { categoryId },
      include: { category: true }
    })

    return NextResponse.json({
      success: true,
      transaction: updated
    })
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
