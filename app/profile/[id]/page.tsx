export const runtime = "nodejs"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPosts } from "@/components/user-posts"
import { FollowButton } from "@/components/follow-button"
import { Calendar, MapPin, User } from "lucide-react"
import { getPool } from "@/lib/db"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { getFollowStatus, getFollowCounts } from "@/app/actions/follow"

interface UserProfilePageProps {
  params: Promise<{ id: string }>
}

async function getUserById(id: number) {
  try {
    const sql = await getPool()
    const users = await sql.query(
      `SELECT u.id, u.nombre, u.apellido, u.alias, u.email, u.pais, u.datos_ocultos, u.created_at, pi.image_data as profile_image_url FROM users u LEFT JOIN profile_images pi ON u.profile_image_id = pi.id WHERE u.id = $1`,
      [id],
    )

    if (users.rows.length === 0) {
      return null
    }

    return users.rows[0]
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = await params
  const userId = Number.parseInt(resolvedParams.id)

  if (isNaN(userId)) {
    notFound()
  }

  const currentUser = await getCurrentUser()

  if (currentUser && currentUser.id === userId) {
    redirect("/profile")
  }

  const user = await getUserById(userId)

  if (!user) {
    notFound()
  }

  const followStatus = await getFollowStatus(userId)
  const followCounts = await getFollowCounts(userId)

  const formatCountryName = (country: string): string => {
    const countryMap: { [key: string]: string } = {
      argentina: "Argentina",
      bolivia: "Bolivia",
      brasil: "Brasil",
      chile: "Chile",
      colombia: "Colombia",
      "costa-rica": "Costa Rica",
      cuba: "Cuba",
      ecuador: "Ecuador",
      "el-salvador": "El Salvador",
      espana: "España",
      guatemala: "Guatemala",
      honduras: "Honduras",
      mexico: "México",
      nicaragua: "Nicaragua",
      panama: "Panamá",
      paraguay: "Paraguay",
      peru: "Perú",
      "puerto-rico": "Puerto Rico",
      "republica-dominicana": "República Dominicana",
      uruguay: "Uruguay",
      venezuela: "Venezuela",
      "estados-unidos": "Estados Unidos",
      canada: "Canadá",
      francia: "Francia",
      alemania: "Alemania",
      italia: "Italia",
      "reino-unido": "Reino Unido",
      portugal: "Portugal",
    }

    return countryMap[country.toLowerCase()] || country.charAt(0).toUpperCase() + country.slice(1)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <Card className="mb-6">
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-600 rounded-t-lg relative">
              <div className="absolute bottom-4 right-4">
                {currentUser && <FollowButton targetUserId={userId} initialIsFollowing={followStatus.isFollowing} />}
              </div>
            </div>

            <div className="absolute -bottom-16 left-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white">
                  <AvatarImage
                    src={user.profile_image_url || "/placeholder.svg"}
                    alt={`Foto de perfil de ${user.datos_ocultos ? user.alias : `${user.nombre} ${user.apellido}`}`}
                  />
                  <AvatarFallback className="text-2xl">
                    {user.datos_ocultos ? (
                      <User className="w-12 h-12" />
                    ) : (
                      <>
                        {user.nombre?.charAt(0)}
                        {user.apellido?.charAt(0)}
                      </>
                    )}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <CardContent className="pt-20 pb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {user.datos_ocultos ? (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">@{user.alias}</h1>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Este usuario ha elegido mantener sus datos personales privados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{followCounts.followers}</div>
                        <div className="text-sm text-gray-600">Seguidores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{followCounts.following}</div>
                        <div className="text-sm text-gray-600">Siguiendo</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{formatCountryName(user.pais)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Se unió el {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {user.nombre} {user.apellido}
                    </h1>
                    <p className="text-gray-600 mb-4">@{user.alias}</p>
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{followCounts.followers}</div>
                        <div className="text-sm text-gray-600">Seguidores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{followCounts.following}</div>
                        <div className="text-sm text-gray-600">Siguiendo</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{formatCountryName(user.pais)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Se unió el {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="ml-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[120px]">
                  <div className="text-lg font-bold text-gray-900">
                    {user.datos_ocultos ? "@" : ""}
                    {user.datos_ocultos ? user.alias : `${user.nombre} ${user.apellido}`}
                  </div>
                  <div className="text-sm text-gray-500">{formatCountryName(user.pais)}</div>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Información del perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{user.datos_ocultos ? "Privado" : "Público"}</div>
                <div className="text-sm text-blue-700">Tipo de perfil</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{formatCountryName(user.pais)}</div>
                <div className="text-sm text-green-700">País</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{formatDate(user.created_at).split(" ")[2]}</div>
                <div className="text-sm text-purple-700">Año de registro</div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        <div className="space-y-6">
          <UserPosts userId={user.id} />
        </div>
      </div>
    </div>
  )
}
