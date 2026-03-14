"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  FileDown,
  History
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface ExportRecord {
  id: string
  type: "TRANSACTIONS" | "REPORTS" | "GOALS" | "BUDGETS" | "ALL"
  format: "PDF" | "CSV" | "XLSX"
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  dateRange: string
  recordCount: number
  fileSize: number | null
  createdAt: string
  completedAt: string | null
}

const typeLabels: Record<string, string> = {
  TRANSACTIONS: "Transações",
  REPORTS: "Relatórios",
  GOALS: "Metas",
  BUDGETS: "Orçamentos",
  ALL: "Todos os Dados"
}

const formatLabels: Record<string, string> = {
  PDF: "PDF",
  CSV: "CSV",
  XLSX: "Excel"
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  COMPLETED: "Concluído",
  FAILED: "Falhou"
}

const dateRangeLabels: Record<string, string> = {
  current_month: "Mês Atual",
  last_month: "Mês Anterior",
  last_3_months: "Últimos 3 Meses",
  last_6_months: "Últimos 6 Meses",
  current_year: "Ano Atual",
  last_year: "Ano Anterior",
  all: "Todos os Dados"
}

export function ExportsView() {
  const [exports, setExports] = useState<ExportRecord[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    type: "TRANSACTIONS" as "TRANSACTIONS" | "REPORTS" | "GOALS" | "BUDGETS" | "ALL",
    format: "PDF" as "PDF" | "CSV" | "XLSX",
    dateRange: "current_month"
  })

  useEffect(() => {
    fetchExports()
  }, [])

  const fetchExports = async () => {
    try {
      const response = await fetch("/api/exports")
      if (response.ok) {
        const data = await response.json()
        setExports(data)
      }
    } catch (error) {
      console.error("Error fetching exports:", error)
      toast.error("Erro ao carregar exportações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error("Erro ao criar exportação")

      const newExport = await response.json()
      setExports(prev => [newExport, ...prev])
      
      // Se tem dados para download, simular download
      if (newExport.downloadReady && newExport.data) {
        const blob = new Blob([JSON.stringify(newExport.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `monetra-export-${formData.type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.${formData.format.toLowerCase()}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      toast.success(`Relatório ${formData.format} gerado com sucesso!`)
    } catch (error) {
      console.error("Error exporting:", error)
      toast.error("Erro ao gerar exportação")
    } finally {
      setIsExporting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando exportações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold flex items-center gap-3">
          <Download className="h-8 w-8 text-amber-500" />
          Exportar Dados
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
          Exporte seus dados em diferentes formatos
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-amber-500" />
                Nova Exportação
              </CardTitle>
              <CardDescription>Selecione os dados e formato desejado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Dados</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSACTIONS">Transações</SelectItem>
                    <SelectItem value="REPORTS">Relatórios</SelectItem>
                    <SelectItem value="GOALS">Metas</SelectItem>
                    <SelectItem value="BUDGETS">Orçamentos</SelectItem>
                    <SelectItem value="ALL">Todos os Dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formato</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["PDF", "CSV", "XLSX"] as const).map((fmt) => (
                    <button key={fmt} onClick={() => setFormData({ ...formData, format: fmt })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.format === fmt ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-amber-300"}`}>
                      <div className="flex flex-col items-center gap-2">
                        {fmt === "PDF" && <FileText className="h-6 w-6 text-red-500" />}
                        {fmt === "CSV" && <FileSpreadsheet className="h-6 w-6 text-green-500" />}
                        {fmt === "XLSX" && <FileSpreadsheet className="h-6 w-6 text-emerald-600" />}
                        <span className="font-medium text-sm">{formatLabels[fmt]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={formData.dateRange} onValueChange={(v) => setFormData({ ...formData, dateRange: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mês Atual</SelectItem>
                    <SelectItem value="last_month">Mês Anterior</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                    <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                    <SelectItem value="current_year">Ano Atual</SelectItem>
                    <SelectItem value="last_year">Ano Anterior</SelectItem>
                    <SelectItem value="all">Todos os Dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar {formData.format}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                Histórico de Exportações
              </CardTitle>
              <CardDescription>{exports.length} exportações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {exports.length === 0 ? (
                <div className="text-center py-12">
                  <FileDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma exportação realizada</p>
                  <p className="text-sm text-muted-foreground mt-1">Suas exportações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {exports.map((exp, index) => (
                    <motion.div key={exp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          exp.format === "PDF" ? "bg-red-100 dark:bg-red-900/30" :
                          exp.format === "CSV" ? "bg-green-100 dark:bg-green-900/30" :
                          "bg-emerald-100 dark:bg-emerald-900/30"
                        }`}>
                          {exp.format === "PDF" ? <FileText className="h-5 w-5 text-red-500" /> : <FileSpreadsheet className="h-5 w-5 text-emerald-600" />}
                        </div>
                        <div>
                          <p className="font-semibold">{typeLabels[exp.type]}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{formatLabels[exp.format]}</Badge>
                            <span>•</span>
                            <span>{dateRangeLabels[exp.dateRange] || exp.dateRange}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={exp.status === "COMPLETED" ? "bg-emerald-500" : exp.status === "PROCESSING" ? "bg-amber-500" : "bg-red-500"}>
                          {exp.status === "COMPLETED" ? <CheckCircle className="h-3 w-3 mr-1" /> : exp.status === "PROCESSING" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Clock className="h-3 w-3 mr-1" />}
                          {statusLabels[exp.status]}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.recordCount} registros • {exp.fileSize ? formatFileSize(exp.fileSize) : '-'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
