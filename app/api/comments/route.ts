
import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { createNotification } from "@/lib/notifications"
import { headers } from "next/headers"
import { limitRequests } from "@/lib/rateLimitPostgres"

export async function GET(request: NextRequest) {
  try {
    const sql = await getPool()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const comments = await sql.query(
      `
      SELECT 
        c.id,
        c.user_id,
        c.post_id_father,
        c.candidate_id,
        c.content,
        c.confirms,
        c.agrees,
        c.disagrees,
        c.es_hecho,
        c.es_opinion,
        c.es_rumor,
        c.created_at,
        u.nombre as author_name,
        u.alias as author_username,
        u.datos_ocultos as author_data_hidden,
        pi.image_data as author_avatar,
        cand.nombre as candidate_name,
        cand.partido as candidate_party,
        cand.tipo_candidatura as candidate_type
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN profile_images pi ON u.profile_image_id = pi.id
      LEFT JOIN candidates cand ON c.candidate_id = cand.id
      WHERE c.post_id_father = $1
      ORDER BY c.created_at ASC
    `,
      [Number.parseInt(postId)],
    )

    const formattedComments = comments.rows.map((comment: any) => ({
      id: comment.id,
      userId: comment.user_id,
      postIdFather: comment.post_id_father,
      candidateId: comment.candidate_id,
      author: comment.author_name,
      username: comment.author_username,
      dataHidden: comment.author_data_hidden,
      avatar: comment.author_avatar || "/placeholder.svg?height=40&width=40",
      content: comment.content,
      confirms: comment.confirms,
      agrees: comment.agrees,
      disagrees: comment.disagrees,
      contentType: comment.es_hecho ? "hecho" : comment.es_opinion ? "opinion" : "rumor",
      timestamp: new Date(comment.created_at).toLocaleString(),
      candidate: comment.candidate_name
        ? {
            name: comment.candidate_name,
            party: comment.candidate_party,
            type: comment.candidate_type,
          }
        : null,
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if(!currentUser.active) {
      return NextResponse.json({ error: "Tu cuenta ha sido desactivada. Contacta al soporte para más información." }, { status: 403 })
    }

    const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0];
    const uniqueKey = currentUser ? currentUser.id : 0;
    // 🚦 Aplicar rate limiting (máx. 5 comments por minuto)
    const allowed = await limitRequests(uniqueKey, "/action/createComment", 5, 1);

    if (!allowed) {
      const sql = await getPool()

      //desactivar usuario
      await sql.query(
        `UPDATE users SET
          active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [currentUser.id],
      )

      //console.log(`Usuario ${currentUser.id} desactivado por exceder el límite de comentarios.`)

      await sql.query(
        `UPDATE comments SET
          is_active = false,
          updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 
          AND created_at >= NOW() - INTERVAL '1 hour';`,
        [currentUser.id],
      )

      //console.log(`Commentarios del usuario ${currentUser.id} desactivados por exceder el límite.`)

      return {
        success: false,
        message: "Has publicado demasiados comentarios en poco tiempo.",
      };
    }

    const { postId, content } = await request.json()

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 })
    }
    const sql = await getPool()

    const parentPost = await sql.query(
      `
      SELECT candidate_id, es_hecho, es_opinion, es_rumor, user_id
      FROM posts 
      WHERE id = $1
    `,
      [Number.parseInt(postId)],
    )

    if (parentPost.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = parentPost.rows[0]

    const newCommentResult = await sql.query(
      `
      INSERT INTO comments (
        user_id, 
        post_id_father, 
        candidate_id, 
        content, 
        es_hecho, 
        es_opinion, 
        es_rumor
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING id
      `,
      [
        currentUser.id,
        Number.parseInt(postId),
        post.candidate_id,
        content.trim(),
        post.es_hecho,
        post.es_opinion,
        post.es_rumor,
      ],
    )

    await sql.query(`
      UPDATE posts
      SET comments = comments + 1
      WHERE id = ${Number.parseInt(postId)}
    `)

    await createNotification({
      userId: post.user_id,
      actorId: currentUser.id,
      type: "new_comment",
      postId: Number.parseInt(postId),
      message: `${currentUser.nombre} ${currentUser.apellido} comentó en tu publicación`,
    })

    return NextResponse.json({
      success: true,
      commentId: newCommentResult.rows[0].id,
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
