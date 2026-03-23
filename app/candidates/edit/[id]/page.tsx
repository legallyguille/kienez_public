"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { updateCandidate } from "@/app/actions/candidates"
import React from "react"

const initialState = {
  success: false,
  message: "",
}

type Candidate = {
  nombre: string
  partido: string
  tipo_candidatura: string
  descripcion?: string
  pais: string
  // add other properties as needed
}

export default function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const candidateId = Number.parseInt(resolvedParams.id)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [tipoCandidatura, setTipoCandidatura] = useState("")
  const [pais, setPais] = useState("")

  const updateCandidateWithId = updateCandidate.bind(null, candidateId)
  const [state, formAction, pending] = useActionState(updateCandidateWithId, initialState)

  useEffect(() => {
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => res.json())
      .then((data) => {
        setCandidate(data)
        setPais(data.pais || "")
        setTipoCandidatura(data.tipo_candidatura || "")
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error loading candidate:", error)
        setLoading(false)
      })
  }, [candidateId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Candidato no encontrado.</p>
            <Link href="/candidates/manage">
              <Button variant="outline" className="mt-4 bg-transparent">
                Volver a Gestión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/candidates/manage">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Gestión de Postulantes
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Editar Postulante</CardTitle>
            <CardDescription>Actualiza los datos del candidato político.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" name="nombre" defaultValue={candidate.nombre} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Select name="pais" value={pais} onValueChange={setPais} defaultValue="costa-rica" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argentina">Argentina</SelectItem>
                    <SelectItem value="bolivia">Bolivia</SelectItem>
                    <SelectItem value="brasil">Brasil</SelectItem>
                    <SelectItem value="chile">Chile</SelectItem>
                    <SelectItem value="colombia">Colombia</SelectItem>
                    <SelectItem value="costa-rica">Costa Rica</SelectItem>
                    <SelectItem value="cuba">Cuba</SelectItem>
                    <SelectItem value="ecuador">Ecuador</SelectItem>
                    <SelectItem value="el-salvador">El Salvador</SelectItem>
                    <SelectItem value="espana">España</SelectItem>
                    <SelectItem value="guatemala">Guatemala</SelectItem>
                    <SelectItem value="honduras">Honduras</SelectItem>
                    <SelectItem value="mexico">México</SelectItem>
                    <SelectItem value="nicaragua">Nicaragua</SelectItem>
                    <SelectItem value="panama">Panamá</SelectItem>
                    <SelectItem value="paraguay">Paraguay</SelectItem>
                    <SelectItem value="peru">Perú</SelectItem>
                    <SelectItem value="puerto-rico">Puerto Rico</SelectItem>
                    <SelectItem value="republica-dominicana">República Dominicana</SelectItem>
                    <SelectItem value="uruguay">Uruguay</SelectItem>
                    <SelectItem value="venezuela">Venezuela</SelectItem>
                    <SelectItem value="estados-unidos">Estados Unidos</SelectItem>
                    <SelectItem value="canada">Canadá</SelectItem>
                    <SelectItem value="francia">Francia</SelectItem>
                    <SelectItem value="alemania">Alemania</SelectItem>
                    <SelectItem value="italia">Italia</SelectItem>
                    <SelectItem value="reino-unido">Reino Unido</SelectItem>
                    <SelectItem value="portugal">Portugal</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">Foto del Candidato</Label>
                <Input id="foto" name="foto" type="file" />
                <p className="text-sm text-gray-500">Sube una nueva imagen para el perfil del candidato.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partido">Partido Político</Label>
                <Input id="partido" name="partido" defaultValue={candidate.partido} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo-candidatura">Tipo de Candidatura</Label>
                <Select name="tipo-candidatura" value={tipoCandidatura} onValueChange={setTipoCandidatura} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de candidatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presidente">Presidente</SelectItem>
                    <SelectItem value="diputado">Diputado</SelectItem>
                    <SelectItem value="alcalde">Alcalde</SelectItem>
                    <SelectItem value="regidor">Regidor</SelectItem>
                    <SelectItem value="senador">Senador</SelectItem>
                    <SelectItem value="gobernador">Gobernador</SelectItem>
                    <SelectItem value="concejal">Concejal</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  defaultValue={candidate.descripcion || ""}
                  placeholder="Breve descripción del candidato"
                />
              </div>

              {state?.message && (
                <div
                  className={`text-center text-sm ${state.success ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"} p-3 rounded-md`}
                >
                  {state.message}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Link href="/candidates/manage" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
