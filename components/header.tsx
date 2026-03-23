import { User, LogOut, Shield, Edit, FileText, Gavel, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { getCurrentUser } from "@/lib/session"
import { logoutUser } from "@/app/actions/auth"
import { SearchDropdown } from "@/components/search-dropdown"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import Logo from "../assets/header/kienez-logo.png";

export async function Header() {
  const user = await getCurrentUser()

  // Si no hay usuario logueado, mostrar header básico
  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            {/* Kienez */}
            <Image
              src={Logo}
              alt="Kienez"
              width={150}
              height={60}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  // Header para usuarios autenticados
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="md:text-2xl lg:text-2xl sm:text-xl font-bold text-blue-500">
          {/* DECERNIT */}
          <Image
            src={Logo}
            alt="Kienez"
            width={150}
            height={60}
            className="object-contain"
          />
        </Link>

        {/* Barra de búsqueda */}
        {/* <div className="flex-1 max-w-md lg:mx-8"> */}
          <SearchDropdown />
        {/* </div> */}

        {/* Accesos rápidos */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <NotificationsDropdown />

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile_image_url || undefined} />
                  <AvatarFallback>
                    {user.nombre.charAt(0)}
                    {user.apellido.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">
                    {user.nombre} {user.apellido}
                  </p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">@{user.alias}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Link>
              </DropdownMenuItem>
              {user.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/reports">
                      <Shield className="mr-2 h-4 w-4" />
                      Gestión de Reportes
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={logoutUser}>
                  <button type="submit" className="flex items-center w-full">
                    <LogOut className="mr-2 h-4 w-4 text-red-600" />
                    Cerrar Sesión
                  </button>
                </form>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="flex flex-row">
                <DropdownMenuItem asChild>
                  <Link href="/terms">
                    <FileText className="mr-2 h-4 w-4" />
                    Términos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/conditions">
                    <Gavel className="mr-2 h-4 w-4" />
                    Condiciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/privacy">
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Privacidad
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
