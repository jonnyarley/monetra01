"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Crown,
  Shield,
  User,
  Eye,
  MoreVertical,
  X,
  Loader2,
  Copy,
  CheckCircle,
  Mail,
  UserPlus,
  Lock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"

interface FamilyMember {
  id: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Family {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  members: FamilyMember[]
  owner?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

const roleLabels = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Visualizador"
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye
}

const roleColors = {
  OWNER: "bg-amber-500",
  ADMIN: "bg-purple-500",
  MEMBER: "bg-blue-500",
  VIEWER: "bg-gray-500"
}

export function FamilyView() {
  const { user, setCurrentView, setSettingsTab } = useAppStore()
  const [ownedFamilies, setOwnedFamilies] = useState<Family[]>([])
  const [memberFamilies, setMemberFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("FREE")
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const [inviteEmail, setInviteEmail] = useState("")

  useEffect(() => {
    fetchUserPlan()
  }, [])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch("/api/subscriptions/")
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data?.plan || "FREE")
      }
    } catch (error) {
      console.error("Error fetching plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFamilies = async () => {
    try {
      const response = await fetch("/api/family/")
      const data = await response.json()
      setOwnedFamilies(data.ownedFamilies || [])
      setMemberFamilies(data.memberFamilies || [])
    } catch (error) {
      console.error("Error fetching families:", error)
      toast.error("Erro ao carregar famílias")
    }
  }

  useEffect(() => {
    if (userPlan === "BUSINESS") {
      fetchFamilies()
    }
  }, [userPlan])

  const handleOpenModal = () => {
    setFormData({ name: "", description: "" })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ name: "", description: "" })
  }

  const handleCreateFamily = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/family/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error("Erro ao criar família")

      const newFamily = await response.json()
      setOwnedFamilies(prev => [...prev, newFamily])
      toast.success("Família criada com sucesso!")
      handleCloseModal()
    } catch (error) {
      console.error("Error creating family:", error)
      toast.error("Erro ao criar família")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFamily = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta família?")) return

    try {
      const response = await fetch(`/api/family/?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Erro ao excluir família")

      setOwnedFamilies(prev => prev.filter(f => f.id !== id))
      toast.success("Família excluída!")
    } catch (error) {
      console.error("Error deleting family:", error)
      toast.error("Erro ao excluir família")
    }
  }

  const handleOpenInvite = (family: Family) => {
    setSelectedFamily(family)
    setInviteEmail("")
    setIsInviteModalOpen(true)
  }

  const handleInviteMember = async () => {
    if (!inviteEmail || !selectedFamily) {
      toast.error("Email é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: selectedFamily.id,
          email: inviteEmail
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Erro ao convidar")

      toast.success(`Convite enviado para ${inviteEmail}!`)
      setIsInviteModalOpen(false)
      fetchFamilies()
    } catch (error: unknown) {
      console.error("Error inviting member:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar convite")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyInviteLink = (familyId: string) => {
    const link = `${window.location.origin}/join?familyId=${familyId}`
    navigator.clipboard.writeText(link)
    toast.success("Link copiado!")
  }

  const handleUpgradePlan = () => {
    setSettingsTab("billing")
    setCurrentView("settings")
  }

  const getRoleIcon = (role: keyof typeof roleIcons) => {
    const Icon = roleIcons[role]
    return <Icon className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show upgrade prompt for non-BUSINESS users
  if (userPlan !== "BUSINESS") {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-500" />
            Modo Família
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
            Gerencie finanças em conjunto com sua família
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Lock className="h-12 w-12 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Recurso Premium</h2>
                  <p className="text-muted-foreground max-w-md">
                    O Modo Família está disponível apenas no plano <strong>Business (R$ 49,90/mês)</strong>.
                  </p>
                </div>
                
                <div className="mt-4 p-4 rounded-lg bg-white/50 dark:bg-black/10 w-full max-w-md">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Benefícios do Modo Família:
                  </h3>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Compartilhe finanças com até 5 membros
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Metas financeiras em conjunto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Controle de gastos familiar
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Diferentes níveis de permissão
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Relatórios IA ilimitados
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleUpgradePlan}
                  className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  size="lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Fazer Upgrade para Business
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const allFamilies = [...ownedFamilies, ...memberFamilies]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-500" />
            Modo Família
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
            Gerencie finanças em conjunto com sua família
          </motion.p>
        </div>
        <Button onClick={handleOpenModal} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Família
        </Button>
      </div>

      {/* Benefits Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Compartilhe finanças com sua família</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Metas compartilhadas para toda família
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Controle de gastos em conjunto
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Diferentes níveis de permissão
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {allFamilies.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Você ainda não faz parte de nenhuma família</p>
            <Button onClick={handleOpenModal} className="bg-gradient-to-r from-amber-500 to-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Criar Família
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allFamilies.map((family, index) => (
            <motion.div
              key={family.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {family.name}
                        {family.ownerId === user?.id && (
                          <Badge className="bg-amber-500">
                            <Crown className="h-3 w-3 mr-1" />
                            Dono
                          </Badge>
                        )}
                      </CardTitle>
                      {family.description && (
                        <CardDescription className="mt-1">{family.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {family.ownerId === user?.id && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenInvite(family)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convidar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyInviteLink(family.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {family.ownerId === user?.id && (
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => handleDeleteFamily(family.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-2">Membros ({family.members.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {family.members.map(member => (
                        <div 
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                              {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {member.user.name || member.user.email}
                                {member.user.id === user?.id && (
                                  <span className="text-muted-foreground ml-1">(você)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.user.email}</p>
                            </div>
                          </div>
                          <Badge className={`${roleColors[member.role]} text-white text-xs`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1">{roleLabels[member.role]}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Family Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={handleCloseModal}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-background rounded-xl shadow-2xl w-full max-w-md" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Nova Família</h2>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Família *</Label>
                  <Input 
                    placeholder="Ex: Família Silva" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea 
                    placeholder="Ex: Controle financeiro da família" 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3}
                  />
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button 
                  onClick={handleCreateFamily} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Família
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={() => setIsInviteModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-background rounded-xl shadow-2xl w-full max-w-md" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Convidar Membro</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsInviteModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Convide um membro para a família <strong>{selectedFamily?.name}</strong>
                </p>
                <div className="space-y-2">
                  <Label>Email do novo membro *</Label>
                  <div className="flex gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-2.5" />
                    <Input 
                      type="email"
                      placeholder="email@exemplo.com" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Ou compartilhe o link de convite</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly
                      value={`${window.location.origin}/join?familyId=${selectedFamily?.id}`}
                      className="bg-muted"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => handleCopyInviteLink(selectedFamily?.id || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleInviteMember} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Convite
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
