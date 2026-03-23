import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPosts } from "@/components/user-posts"
import { Share2, Users, Calendar, MapPin, Mail } from "lucide-react"

async function getUserData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users/${id}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const user = await getUserData(params.id)

  if (!user) {
    notFound()
  }

  // Generar un gradiente único basado en el ID del usuario
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-blue-600",
    "from-purple-500 to-pink-600",
    "from-red-500 to-orange-600",
    "from-indigo-500 to-blue-600",
    "from-teal-500 to-green-600",
  ]
  const gradientIndex = Number.parseInt(params.id) % gradients.length
  const gradient = gradients[gradientIndex]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header del Usuario */}
      <Card className="overflow-hidden">
        {/* Portada */}
        <div className={`h-48 bg-gradient-to-r ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end gap-4">
              {/* Foto de perfil */}
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div
                  className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 text-white pb-2">
                <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <span>@{user.username}</span>
                  {user.pais && (
                    <>
                      <span>•</span>
                      <MapPin className="w-4 h-4" />
                      <span>{user.pais}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Se unió en{" "} 
                  {new Date(user.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                  })}
                </Badge>
                {user.email && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Verificado
                  </Badge>
                )}
              </div>

              {user.bio && (
                <div className="text-gray-600">
                  <p>{user.bio}</p>
                </div>
              )}
            </div>

            {/* Estadísticas y acciones */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-xs text-blue-700">Seguidores</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-green-700">Siguiendo</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  Seguir
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts del usuario (sin CreatePost ni botón de editar) */}
      <UserPosts userId={Number.parseInt(params.id)} />
    </div>
  )
}
