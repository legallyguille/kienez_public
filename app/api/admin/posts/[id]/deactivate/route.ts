import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ message: "ID de publicación inválido" }, { status: 400 })
    }

    const pool = await getPool()

    // Update the post to set is_active to false
    const result = await pool.query("UPDATE posts SET is_active = false WHERE id = $1", [postId])

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Publicación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Publicación inactivada exitosamente" }, { status: 200 })
  } catch (error) {
    console.error("Error deactivating post:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
