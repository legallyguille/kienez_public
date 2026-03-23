import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Función para decodificar el token (duplicada del session.ts para uso en middleware)
function decodeToken(token: string): { userId: number; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [userId, timestamp] = decoded.split(":")

    // Verificar que el token no haya expirado (7 días)
    const now = Date.now()
    const tokenAge = now - Number.parseInt(timestamp)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 días en milisegundos

    if (tokenAge > maxAge) {
      return null
    }

    return {
      userId: Number.parseInt(userId),
      timestamp: Number.parseInt(timestamp),
    }
  } catch (error) {
    return null
  }
}

// Rutas que requieren autenticación
//const protectedRoutes = ["/profile", "/candidates"]
const protectedRoutes = ["/profile"]

const adminRoutes = ["/candidates/manage", "/candidates/create", "/kvideos/create", "/kvideos/edit" ]

// Rutas que solo pueden acceder usuarios no autenticados
const authRoutes = ["/login", "/register"]

// const sql = postgres(process.env.DATABASE_URL!)

async function getUserRole(userId: number, request: NextRequest): Promise<string | null> {
  try {
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/auth/check-role`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.role
  } catch (error) {
    console.error("Error fetching user role:", error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")

  // Verificar si el usuario está autenticado
  let isAuthenticated = false
  let userId: number | null = null
  if (sessionCookie) {
    const tokenData = decodeToken(sessionCookie.value)
    if (tokenData) {
      isAuthenticated = true
      userId = tokenData.userId
    }
  }

  // Redirigir usuarios no autenticados de rutas protegidas
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const userRole = await getUserRole(userId!, request)
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Redirigir usuarios autenticados de rutas de auth
  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
