export const runtime = 'nodejs'
import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sql = await getPool()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [], candidates: [] })
    }

    const searchTerm = `%${query.trim()}%`

    // Buscar usuarios
    const users = await sql.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.alias,
        pi.image_data as profile_image_url
      FROM users u
      LEFT JOIN profile_images pi ON u.profile_image_id = pi.id
      WHERE 
        LOWER(u.nombre) LIKE LOWER($1) OR
        LOWER(u.apellido) LIKE LOWER($1) OR
        LOWER(u.alias) LIKE LOWER($1) OR
        LOWER(CONCAT(u.nombre, ' ', u.apellido)) LIKE LOWER($1)
      LIMIT 5
    `, [searchTerm])

    // Buscar candidatos
    const candidates = await sql.query(`
      SELECT 
        id,
        nombre,
        partido,
        tipo_candidatura,
        pais
      FROM candidates
      WHERE 
        LOWER(nombre) LIKE LOWER($1) OR
        LOWER(partido) LIKE LOWER($1)
      LIMIT 5
    `, [searchTerm])

    return NextResponse.json({
      users: users.rows.map((user) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        alias: user.alias,
        profileImageUrl: user.profile_image_url,
        type: "user",
      })),
      candidates: candidates.rows.map((candidate) => ({
        id: candidate.id,
        nombre: candidate.nombre,
        partido: candidate.partido,
        tipo_candidatura: candidate.tipo_candidatura,
        pais: candidate.pais,
        type: "candidate",
      })),
    })
  } catch (error) {
    console.error("Error en búsqueda:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
