export const runtime = 'nodejs'

import "server-only"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import crypto from "crypto"

export interface User {
  id: number
  nombre: string
  apellido: string
  alias: string
  email: string
  pais: string
  datos_ocultos: boolean
  role: string
  active?: boolean
  fecha_nacimiento?: string
  sexo?: string
  profile_image_url?: string
}

// Función para crear un token simple y seguro
function createToken(userId: number): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(16).toString("hex")
  const data = `${userId}:${timestamp}:${randomBytes}`
  return Buffer.from(data).toString("base64")
}

// Función para decodificar el token
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

// Crear sesión de usuario
export async function createSession(user: User) {
  const token = createToken(user.id)

  // Configurar cookie con el token
  ;(await
    // Configurar cookie con el token
    cookies()).set("session", token, {
    httpOnly: true, // No accesible desde JavaScript del cliente
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
    path: "/",
  })

  // 🧹 eliminar modo invitado
  ;(await cookies()).delete("guest")
}

// Obtener usuario actual de la sesión
export async function getCurrentUser(): Promise<User | null> {
  try {
    const sessionCookie = (await cookies()).get("session")

    if (!sessionCookie) {
      return null
    }

    const tokenData = decodeToken(sessionCookie.value)

    if (!tokenData) {
      return null
    }

    // Obtener datos actualizados del usuario desde la base de datos
    const pool = await getPool()
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.alias, 
        u.email, 
        u.pais, 
        u.datos_ocultos,
        u.role,
        u.active,
        pi.image_data as profile_image_url
      FROM users u
      LEFT JOIN profile_images pi ON u.profile_image_id = pi.id
      WHERE u.id = $1`,
      [tokenData.userId]
    )
    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as User
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

//usuario invitado
export async function isGuestUser(): Promise<boolean> {
  const guestCookie = (await cookies()).get("guest");
  return guestCookie?.value === "true";
}

// Cerrar sesión
export async function destroySession() {
  (await cookies()).delete("session")
}

// Verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}
