export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const sql = await getPool()

    if (!user) {
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    // Obtener datos completos del usuario incluyendo fecha de nacimiento, sexo y active
    const fullUserData = await sql.query(`
      SELECT u.id, u.nombre, u.apellido, u.fecha_nacimiento, u.sexo, u.pais, u.alias, u.email, u.datos_ocultos, u.role, u.active, pi.image_data AS profile_image_url
      FROM users AS u
      LEFT JOIN profile_images AS pi ON u.id = pi.user_id
      WHERE u.id = $1
    `, [user.id])

    if (fullUserData.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = fullUserData.rows[0]

    // Formatear la fecha para el input date
    let formattedDate = ""
    if (userData.fecha_nacimiento) {
      const date = new Date(userData.fecha_nacimiento)
      formattedDate = date.toISOString().split("T")[0] // Formato YYYY-MM-DD
    }

    return NextResponse.json({
      user: {
        ...userData,
        fecha_nacimiento: formattedDate,
      },
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
