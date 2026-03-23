"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { updateProfile, logout } from "@/app/actions/profile"
import type { User } from "@/lib/session"
import Image from "next/image"

const initialState = {
  success: false,
  message: "",
  shouldLogout: false,
}

interface EditProfilePageProps {
  user: User
}

function EditProfileForm({ user }: EditProfilePageProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState)
  const [sexo, setSexo] = useState(user.sexo || "")
  const [pais, setPais] = useState(user.pais || "")
  const [datosOcultos, setDatosOcultos] = useState(user.datos_ocultos || false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>(user.profile_image_url || "")

  useEffect(() => {
    if (state?.shouldLogout) {
      // Esperar 5 segundos y luego hacer logout
      const timer = setTimeout(() => {
        logout()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB límite
        alert("La imagen debe ser menor a 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen")
        return
      }

      setProfileImage(file)

      // console.log("profileImageFile:", {
      //   name: file.name,
      //   size: file.size,
      //   type: file.type,
      // })
      // console.log("profileImagePreview:", profileImagePreview)
      // console.log("profileImage:", profileImage)
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProfileImage(null)
    setProfileImagePreview("")
  }

  useEffect(() => {
    if (state.success && state.message) {
      const timer = setTimeout(() => {
        // El mensaje se mantendrá visible hasta que el usuario navegue
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Editar Perfil</CardTitle>
        <CardDescription>Actualiza tu información personal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Imagen de Perfil</Label>
            <div className="flex items-center space-x-4">
              {profileImagePreview ? (
                <div className="relative">
                  <Image
                    src={profileImagePreview || "/placeholder.svg"}
                    alt="Vista previa"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image"
                  name="profile-image"
                />
                <Label
                  htmlFor="profile-image"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar imagen
                </Label>
                <p className="text-xs text-gray-500 mt-1">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={user.nombre} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" name="apellido" defaultValue={user.apellido} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha-nacimiento">Fecha de Nacimiento</Label>
            <Input
              id="fecha-nacimiento"
              name="fecha-nacimiento"
              type="date"
              defaultValue={user.fecha_nacimiento || ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Select name="sexo" value={sexo} onValueChange={setSexo} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
                <SelectItem value="prefiero-no-decir">Prefiero no decir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">País</Label>
            <Select name="pais" value={pais} onValueChange={setPais} required>
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
            <Label htmlFor="alias">Alias</Label>
            <Input id="alias" name="alias" defaultValue={user.alias} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} required />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="datos-ocultos"
              name="datos-ocultos"
              checked={datosOcultos}
              onCheckedChange={(checked) => setDatosOcultos(checked as boolean)}
            />
            <Label htmlFor="datos-ocultos" className="text-sm">
              Deseo mantener mis datos ocultos
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
            <Input id="password" name="password" type="password" placeholder="Dejar en blanco para mantener actual" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              placeholder="Confirma la nueva contraseña"
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
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error al obtener usuario:", error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos del perfil...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar los datos del usuario.</p>
              <Link href="/profile">
                <Button variant="outline">Volver al Perfil</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/profile">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al perfil
            </Button>
          </Link>
        </div>

        <EditProfileForm user={user} />
      </div>
    </div>
  )
}
