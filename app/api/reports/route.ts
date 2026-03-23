export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, reason, description } = await request.json()

    if (!postId || !reason) {
      return NextResponse.json({ error: "Post ID and reason are required" }, { status: 400 })
    }

    // Verificar que el post existe
    const sql = await getPool()
    const post = await sql.query(`
      SELECT id, user_id FROM posts 
      WHERE id = $1 AND is_active = true
    `, [postId])

    if (post.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // No permitir que el usuario reporte su propio post
    if (post.rows[0].user_id === user.id) {
      return NextResponse.json({ error: "You cannot report your own post" }, { status: 400 })
    }

    // Verificar si el usuario ya reportó este post
    const existingReport = await sql.query(`
      SELECT id FROM reports 
      WHERE user_id = $1 AND post_id = $2
    `,  [user.id, postId])

    if (existingReport.rows.length > 0) {
      return NextResponse.json({ error: "You have already reported this post" }, { status: 400 })
    }

    // Crear el reporte
    await sql.query(`
      INSERT INTO reports (user_id, post_id, reason, description)
      VALUES ($1, $2, $3, $4)
    `, [user.id, postId, reason, description])

    return NextResponse.json({ success: true, message: "Report submitted successfully" })
  } catch (error) {
    console.error("Error in report API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
