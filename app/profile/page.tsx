import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreatePost } from "@/components/create-post"
import { UserPosts } from "@/components/user-posts"
import { Camera, Edit } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { getFollowStatus, getFollowCounts } from "@/app/actions/follow"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const followStatus = await getFollowStatus(user.id)
  const followCounts = await getFollowCounts(user.id)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto pt-20 px-2">
        {/* Portada del perfil */}
        <Card className="mb-6">
          <div className="relative">
            {/* Foto de portada */}
            <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-lg relative">
              {/* <Button variant="secondary" size="sm" className="absolute bottom-4 right-4">
                <Camera className="w-4 h-4 mr-2" />
                Cambiar portada
              </Button> */}
            </div>

            {/* Foto de perfil */}
            <div className="absolute -bottom-16 left-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white">
                  <AvatarImage 
                    src={user.profile_image_url || "/placeholder.svg"} 
                    alt={`Foto de perfil de ${user.datos_ocultos ? user.alias : `${user.nombre} ${user.apellido}`}`} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.nombre.charAt(0)}
                    {user.apellido.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="secondary" size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="pt-20 pb-6">
            <div className="flex justify-between items-start">
              {user.datos_ocultos === true ? (
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.alias}
                    <p className="text-sm text-gray-500 mt-1">{formatCountryName(user.pais)}</p>
                  </h1>
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
                </div>
                
              ) : (
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.nombre} {user.apellido}
                  </h1>
                  <p className="text-gray-600">@{user.alias}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatCountryName(user.pais)}</p>
                </div>
              )}
              <Link href="/profile/edit">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar perfil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contenido del perfil */}
        <div className="space-y-6">
          <CreatePost />
          <UserPosts userId={user.id} />
        </div>
      </div>
    </div>
  )
}
