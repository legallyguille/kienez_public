export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { deletePost } from "@/app/actions/posts"
import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = parseInt(params.id)
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const result = await deletePost(postId)

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in delete post API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = parseInt(params.id)
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 })
    }

    // Verificar que el post existe y pertenece al usuario
    const sql = await getPool()
    const post = await sql.query(`
      SELECT id, user_id FROM posts 
      WHERE id = $1 AND is_active = true
    `, [postId])

    if (post.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 })
    }

    // Actualizar el post
    await sql.query(`
      UPDATE posts SET 
        content = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [content.trim(), postId])

    return NextResponse.json({ success: true, message: "Post updated successfully" })
  } catch (error) {
    console.error("Error in edit post API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
