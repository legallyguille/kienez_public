export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sql = await getPool()
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Obtener datos del usuario
    const userResult = await sql.query(`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.alias, 
        u.email, 
        u.pais, 
        u.datos_ocultos,
        u.role,
        u.created_at,
        pi.image_data as profile_image_url
      FROM users u
      LEFT JOIN profile_images pi ON u.profile_image_id = pi.id
      WHERE u.id = $1
    `, [userId])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Formatear la respuesta según la configuración de privacidad
    const userData = {
      id: user.id,
      nombre: user.datos_ocultos ? null : user.nombre,
      apellido: user.datos_ocultos ? null : user.apellido,
      alias: user.alias,
      pais: user.pais,
      datos_ocultos: user.datos_ocultos,
      role: user.role,
      created_at: user.created_at,
      profile_image_url: user.profile_image_url, // Agregada imagen de perfil
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
