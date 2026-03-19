import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import * as XLSX from "xlsx"
import { db } from "@/lib/db"
import { getJwtSecret } from "@/lib/jwt-secret"
import { RecurringFrequency, Prisma } from "@prisma/client"
import { invalidateUserCache, invalidateTransactionCache } from "@/lib/cache"

// Helper para converter valor brasileiro para número
function toNumber(val: any): number | null {
  if (val === null || val === undefined) return null
  
  if (typeof val === "number") {
    if (!isNaN(val) && isFinite(val)) return val
    return null
  }
  
  if (typeof val === "string") {
    let str = val.trim()
    if (!str || str === "-" || str === "R$") return null
    
    // Detectar se é negativo
    const isNegative = str.startsWith('-')
    if (isNegative) {
      str = str.substring(1).trim()
    }
    
    // Remover símbolos de moeda e espaços
    str = str.replace(/R\$/g, "").replace(/\s/g, "").trim()
    
    // Formato brasileiro: vírgula como decimal, ponto como milhar
    const hasComma = str.includes(",")
    const hasDot = str.includes(".")
    
    if (hasComma && hasDot) {
      // Formato brasileiro: 1.234.567,89
      if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
        str = str.replace(/\./g, "").replace(",", ".")
      } else {
        str = str.replace(/,/g, "")
      }
    } else if (hasComma) {
      // Só vírgula: 1234,56 -> 1234.56
      str = str.replace(",", ".")
    }
    
    let num = parseFloat(str)
    if (isNaN(num) || !isFinite(num)) return null
    
    // Aplicar sinal negativo se necessário
    return isNegative ? -num : num
  }
  
  return null
}

// Helper para converter para data de forma segura
function toDate(val: any): Date | null {
  if (val === null || val === undefined) return null
  
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) return val
    return null
  }
  
  if (typeof val === "number") {
    if (val > 25500 && val < 60000) {
      const date = new Date((val - 25569) * 86400 * 1000)
      if (!isNaN(date.getTime())) return date
    }
    return null
  }
  
  if (typeof val === "string") {
    const str = val.trim()
    if (!str) return null
    
    // Brasileiro: 01/01/2026 ou 9/1/2026
    let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2])
      const year = parseInt(match[3])
      const date = new Date(year, month - 1, day)
      if (!isNaN(date.getTime())) return date
    }
    
    // ISO: 2026-01-01
    match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (match) {
      const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      if (!isNaN(date.getTime())) return date
    }
    
    // Com hífen: 01-01-2026
    match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2])
      const year = parseInt(match[3])
      const date = new Date(year, month - 1, day)
      if (!isNaN(date.getTime())) return date
    }
  }
  
  return null
}

// Verificar se é recorrente
function isRecurring(val: any): boolean {
  if (val === null || val === undefined) return false
  const str = String(val).toLowerCase().trim()
  return str === "sim" || str === "s" || str === "yes" || str === "y" ||
         str === "true" || str === "1" || str === "recorrente" ||
         str === "fixo" || str === "mensal"
}

// Detectar frequência
function detectFrequency(val: any): RecurringFrequency {
  if (val === null || val === undefined) return RecurringFrequency.MONTHLY
  const str = String(val).toLowerCase().trim()
  if (str.includes("diário") || str.includes("diario") || str.includes("daily")) return RecurringFrequency.DAILY
  if (str.includes("semanal") || str.includes("weekly")) return RecurringFrequency.WEEKLY
  if (str.includes("anual") || str.includes("yearly") || str.includes("ano")) return RecurringFrequency.YEARLY
  return RecurringFrequency.MONTHLY
}

// Interface para transação
interface ParsedTransaction {
  date: Date
  amount: number
  description: string
  type: "INCOME" | "EXPENSE"
  isRecurring: boolean
  frequency: RecurringFrequency
  dayOfMonth: number
  category?: string
}

// Parsear linha CSV respeitando aspas
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === separator && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Parser para CSV brasileiro
function parseCSVBuffer(buffer: ArrayBuffer): {
  transactions: ParsedTransaction[]
  recorrentes: ParsedTransaction[]
} {
  const transactions: ParsedTransaction[] = []
  const recorrentes: ParsedTransaction[] = []

  try {
    let text = new TextDecoder('utf-8').decode(buffer)
    
    // Tentar latin-1 se tiver caracteres estranhos
    if (text.includes('Ã') || text.includes('Â')) {
      text = new TextDecoder('iso-8859-1').decode(buffer)
    }
    
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) return { transactions, recorrentes }
    
    const separator = lines[0].includes(';') ? ';' : ','
    const headers = parseCSVLine(lines[0], separator).map(h => h.toLowerCase().trim())
    
    console.log("[CSV] Headers:", headers)
    console.log("[CSV] Separator:", separator)
    
    // Encontrar índices
    const idx = {
      date: headers.findIndex(h => h === 'data'),
      desc: headers.findIndex(h => h === 'descricao' || h === 'descrição' || h === 'description'),
      value: headers.findIndex(h => h === 'valor' || h === 'value'),
      type: headers.findIndex(h => h === 'tipo' || h === 'type'),
      category: headers.findIndex(h => h === 'categoria' || h === 'category'),
      recurring: headers.findIndex(h => h === 'recorrente' || h === 'fixo')
    }
    
    console.log("[CSV] Índices:", idx)
    
    // Processar linhas
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = parseCSVLine(line, separator)
      if (values.length < 4) continue
      
      try {
        // Data
        const date = idx.date >= 0 ? toDate(values[idx.date]) : null
        
        // Descrição
        const description = idx.desc >= 0 ? (values[idx.desc]?.trim() || "") : ""
        
        // Tipo (do CSV)
        let tipoFromCSV = ""
        if (idx.type >= 0) {
          tipoFromCSV = values[idx.type]?.toLowerCase().trim() || ""
        }
        
        // Valor
        let amount: number | null = null
        if (idx.value >= 0) {
          amount = toNumber(values[idx.value])
        }
        
        if (amount === null || amount === 0) continue
        
        // Determinar tipo e valor final
        let type: "INCOME" | "EXPENSE"
        let finalAmount: number
        
        // Se tem coluna de tipo, usar ela
        if (tipoFromCSV === 'receita' || tipoFromCSV === 'income' || tipoFromCSV === 'entrada') {
          type = "INCOME"
          finalAmount = Math.abs(amount)
        } else if (tipoFromCSV === 'despesa' || tipoFromCSV === 'expense' || tipoFromCSV === 'saida' || tipoFromCSV === 'saída') {
          type = "EXPENSE"
          finalAmount = Math.abs(amount)
        } else {
          // Sem coluna de tipo, usar sinal do valor
          if (amount > 0) {
            type = "INCOME"
            finalAmount = amount
          } else {
            type = "EXPENSE"
            finalAmount = Math.abs(amount)
          }
        }
        
        // Categoria
        const category = idx.category >= 0 ? (values[idx.category]?.trim() || undefined) : undefined
        
        // Recorrente
        let isRecurringRow = false
        if (idx.recurring >= 0) {
          isRecurringRow = isRecurring(values[idx.recurring])
        }
        
        if (finalAmount > 0 && description) {
          const tx: ParsedTransaction = {
            date: date || new Date(),
            amount: finalAmount,
            description: description.substring(0, 200),
            type,
            isRecurring: isRecurringRow,
            frequency: RecurringFrequency.MONTHLY,
            dayOfMonth: date ? date.getDate() : 1,
            category
          }
          
          transactions.push(tx)
          if (isRecurringRow) recorrentes.push(tx)
          
          console.log(`[CSV] OK: ${tx.date.toISOString().split('T')[0]} | ${tx.type} | R$ ${tx.amount} | ${tx.description}`)
        }
      } catch (err) {
        console.error(`[CSV] Erro linha ${i}:`, err)
      }
    }
    
  } catch (error) {
    console.error("[CSV] Erro:", error)
  }

  return { transactions, recorrentes }
}

// Parser para Excel
function parseExcel(buffer: ArrayBuffer): {
  transactions: ParsedTransaction[]
  recorrentes: ParsedTransaction[]
} {
  const transactions: ParsedTransaction[] = []
  const recorrentes: ParsedTransaction[] = []

  try {
    console.log("[XLSX] Buffer size:", buffer.byteLength)
    
    const workbook = XLSX.read(buffer, { type: "array", raw: false })
    console.log("[XLSX] Sheets:", workbook.SheetNames)
    
    if (!workbook.SheetNames.length) return { transactions, recorrentes }

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null }) as Record<string, any>[]
      
      if (!jsonData || jsonData.length === 0) continue
      console.log(`[XLSX] Processando "${sheetName}": ${jsonData.length} linhas`)

      const lowerSheetName = sheetName.toLowerCase()
      const sheetIsRecurring = lowerSheetName.includes("recorrente") || lowerSheetName.includes("fixo")

      const columns = Object.keys(jsonData[0])
      const colTypes: Record<string, string> = {}
      
      columns.forEach(col => {
        const lower = col.toLowerCase().trim()
        if (lower.includes("data") || lower === "date") colTypes[col] = "date"
        else if (lower === "tipo" || lower === "type") colTypes[col] = "type"
        else if (lower === "valor" || lower === "value" || lower.includes("r$")) colTypes[col] = "amount"
        else if (lower.includes("descri") || lower.includes("desc")) colTypes[col] = "description"
        else if (lower.includes("categoria")) colTypes[col] = "category"
        else colTypes[col] = "other"
      })
      
      console.log(`[XLSX] Colunas:`, colTypes)

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        
        try {
          let date: Date | null = null
          let amount: number | null = null
          let type: "INCOME" | "EXPENSE" = "EXPENSE"
          let description = ""
          let category: string | undefined
          let tipoFromCol = ""

          // Data
          for (const col of columns) {
            if (colTypes[col] === "date" && !date) {
              date = toDate(row[col])
            }
          }

          // Tipo da coluna
          for (const col of columns) {
            if (colTypes[col] === "type") {
              tipoFromCol = String(row[col] || "").toLowerCase().trim()
            }
          }

          // Valor
          for (const col of columns) {
            if (colTypes[col] === "amount" && amount === null) {
              amount = toNumber(row[col])
            }
          }

          // Descrição
          for (const col of columns) {
            if (colTypes[col] === "description" && !description) {
              description = String(row[col] || "").trim()
            }
          }

          // Categoria
          for (const col of columns) {
            if (colTypes[col] === "category") {
              category = String(row[col] || "").trim() || undefined
            }
          }

          if (amount === null || amount === 0) continue

          // Determinar tipo
          let finalAmount: number
          if (tipoFromCol === "receita" || tipoFromCol === "income" || tipoFromCol === "entrada") {
            type = "INCOME"
            finalAmount = Math.abs(amount)
          } else if (tipoFromCol === "despesa" || tipoFromCol === "expense" || tipoFromCol === "saida") {
            type = "EXPENSE"
            finalAmount = Math.abs(amount)
          } else {
            if (amount > 0) {
              type = "INCOME"
              finalAmount = amount
            } else {
              type = "EXPENSE"
              finalAmount = Math.abs(amount)
            }
          }

          if (!description) description = type === "INCOME" ? "Receita" : "Despesa"

          if (finalAmount > 0) {
            const tx: ParsedTransaction = {
              date: date || new Date(),
              amount: finalAmount,
              description: description.substring(0, 200),
              type,
              isRecurring: sheetIsRecurring,
              frequency: RecurringFrequency.MONTHLY,
              dayOfMonth: date ? date.getDate() : 1,
              category
            }
            
            transactions.push(tx)
            if (sheetIsRecurring) recorrentes.push(tx)
            
            console.log(`[XLSX] OK: ${tx.date.toISOString().split('T')[0]} | ${tx.type} | R$ ${tx.amount} | ${tx.description}`)
          }
        } catch (err) {
          console.error(`[XLSX] Erro linha ${i}:`, err)
        }
      }
    }
    
    console.log(`[XLSX] Total: ${transactions.length} transações`)
    
  } catch (error) {
    console.error("[XLSX] Erro:", error)
  }

  return { transactions, recorrentes }
}

// GET
export async function GET() {
  return NextResponse.json({ 
    message: "API de importação funcionando!",
    supportedFormats: ["XLSX", "XLS", "CSV"],
    usage: "Envie um arquivo via POST com FormData (campo 'file')"
  })
}

// POST
export async function POST(request: NextRequest) {
  console.log("[IMPORT] ========== INICIANDO ==========")
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jwtSecret = getJwtSecret()
    let decoded: { id: string }
    
    try {
      decoded = verify(token, jwtSecret) as { id: string }
    } catch {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 })
    }

    console.log(`[IMPORT] Arquivo: ${file.name}, ${file.size} bytes`)

    const fileName = file.name.toLowerCase()
    const buffer = await file.arrayBuffer()
    
    let parsedData: { transactions: ParsedTransaction[], recorrentes: ParsedTransaction[] }
    
    if (fileName.endsWith(".csv")) {
      parsedData = parseCSVBuffer(buffer)
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      parsedData = parseExcel(buffer)
    } else {
      return NextResponse.json({ error: "Formato não suportado. Use CSV, XLSX ou XLS." }, { status: 400 })
    }

    const { transactions, recorrentes } = parsedData

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Nenhuma transação encontrada. Verifique se a planilha tem colunas Data, Valor e Tipo." }, { status: 400 })
    }

    console.log(`[IMPORT] ${transactions.length} transações, ${recorrentes.length} recorrentes`)

    // Importar transações
    const imported = []
    const duplicates = []

    for (const tx of transactions) {
      try {
        const existing = await db.transaction.findFirst({
          where: {
            userId: decoded.id,
            amount: tx.amount,
            date: tx.date,
            description: { startsWith: tx.description.substring(0, 20) }
          }
        })

        if (existing) {
          duplicates.push(tx)
          continue
        }

        const transaction = await db.transaction.create({
          data: {
            userId: decoded.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
            isPaid: true,
            isRecurring: tx.isRecurring,
            notes: `Importado de: ${file.name}`
          }
        })

        imported.push(transaction)
      } catch (err) {
        console.error("[IMPORT] Erro:", err)
      }
    }

    // Importar recorrentes
    const recorrentesImportados = []

    for (const tx of recorrentes) {
      try {
        const today = new Date()
        const nextDueDate = new Date(today.getFullYear(), today.getMonth(), tx.dayOfMonth)
        if (nextDueDate < today) nextDueDate.setMonth(nextDueDate.getMonth() + 1)

        const recurring = await db.recurringTransaction.create({
          data: {
            userId: decoded.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            frequency: tx.frequency,
            dayOfMonth: tx.dayOfMonth,
            startDate: tx.date,
            nextDueDate,
            isActive: true,
            autoCreate: true,
            notifyBefore: 3
          }
        })
        recorrentesImportados.push(recurring)
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') break
        console.error("[IMPORT] Erro recorrente:", err)
      }
    }

    // Verificar e atribuir conquistas automaticamente
    // Isso atualizará o score corretamente baseado nos achievements
    if (imported.length > 0) {
      try {
        // Chamar a API de monscore internamente para verificar conquistas
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/monscore`, {
          method: 'POST',
          headers: {
            'Cookie': `auth_token=${token}`
          }
        })
        console.log("[IMPORT] Verificação de conquistas acionada")
      } catch (err) {
        console.error("[IMPORT] Erro ao verificar conquistas:", err)
      }
    }

    const totalIncome = imported.filter(t => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = imported.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0)

    // Invalidar cache do dashboard e transações
    await invalidateUserCache(decoded.id)
    console.log("[IMPORT] Cache invalidado")

    console.log(`[IMPORT] ========== FINALIZADO ==========`)
    console.log(`[IMPORT] ${imported.length} importadas, ${duplicates.length} duplicadas`)
    console.log(`[IMPORT] Receitas: R$ ${totalIncome}, Despesas: R$ ${totalExpense}`)

    return NextResponse.json({
      success: true,
      imported: imported.length,
      duplicates: duplicates.length,
      recorrentes: recorrentesImportados.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      sample: imported.slice(0, 5).map(t => ({
        date: t.date.toISOString().split('T')[0],
        amount: Number(t.amount),
        type: t.type,
        description: t.description?.substring(0, 50)
      }))
    })

  } catch (error: unknown) {
    console.error("[IMPORT] Erro:", error)
    return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 500 })
  }
}
