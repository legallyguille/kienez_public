export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { createNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const sql = await getPool()
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if(!currentUser.active) {
      return NextResponse.json({ error: "Tu cuenta ha sido desactivada. Contacta al soporte para más información." }, { status: 403 })
    }

    const { commentId, reactionType } = await request.json()

    if (!commentId || !reactionType) {
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 })
    }

    if (!["confirms", "agrees", "disagrees"].includes(reactionType)) {
      return NextResponse.json({ error: "Tipo de reacción inválido" }, { status: 400 })
    }

    const commentInfo = await sql.query(
      `
      SELECT user_id FROM comments WHERE id = $1
    `,
      [commentId],
    )

    if (commentInfo.rows.length === 0) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 })
    }

    const commentAuthorId = commentInfo.rows[0].user_id

    // Verificar si el usuario ya reaccionó a este comentario
    const existingReaction = await sql.query(
      `
      SELECT reaction_type FROM comment_reactions 
      WHERE comment_id = $1 AND user_id = $2
    `,
      [commentId, currentUser.id],
    )

    if (existingReaction.rows.length > 0) {
      const currentReaction = existingReaction.rows[0].reaction_type

      if (currentReaction === reactionType) {
        // Si es la misma reacción, la eliminamos
        await sql.query(
          `
          DELETE FROM comment_reactions 
          WHERE comment_id = $1 AND user_id = $2
        `,
          [commentId, currentUser.id],
        )

        // Decrementar el contador
        await sql.query(`UPDATE comments SET ${reactionType} = ${reactionType} - 1 WHERE id = $1`, [commentId])
      } else {
        // Si es diferente, actualizamos la reacción
        await sql.query(
          `
          UPDATE comment_reactions 
          SET reaction_type = $1 
          WHERE comment_id = $2 AND user_id = $3
        `,
          [reactionType, commentId, currentUser.id],
        )

        // Decrementar el contador anterior e incrementar el nuevo
        await sql.query(
          `UPDATE comments 
          SET ${currentReaction} = ${currentReaction} - 1,
              ${reactionType} = ${reactionType} + 1 
          WHERE id = $1
        `,
          [commentId],
        )

        const reactionLabels = {
          confirms: "confirmó",
          agrees: "coincidió con",
          disagrees: "está en desacuerdo con",
        }

        await createNotification({
          userId: commentAuthorId,
          actorId: currentUser.id,
          type: "comment_reaction",
          commentId: commentId,
          reactionType: reactionType,
          message: `${currentUser.nombre} ${currentUser.apellido} ${reactionLabels[reactionType as keyof typeof reactionLabels]} tu comentario`,
        })
      }
    } else {
      // Nueva reacción
      await sql.query(
        `
        INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
        VALUES ($1, $2, $3)
      `,
        [commentId, currentUser.id, reactionType],
      )

      // Incrementar el contador
      await sql.query(
        `
        UPDATE comments
        SET ${reactionType} = ${reactionType} + 1
        WHERE id = $1
      `,
        [commentId],
      )

      const reactionLabels = {
        confirms: "confirmó",
        agrees: "coincidió con",
        disagrees: "está en desacuerdo con",
      }

      await createNotification({
        userId: commentAuthorId,
        actorId: currentUser.id,
        type: "comment_reaction",
        commentId: commentId,
        reactionType: reactionType,
        message: `${currentUser.nombre} ${currentUser.apellido} ${reactionLabels[reactionType as keyof typeof reactionLabels]} tu comentario`,
      })
    }

    // Obtener los contadores actualizados
    const updatedComment = await sql.query(
      `
      SELECT confirms, agrees, disagrees FROM comments WHERE id = $1
    `,
      [commentId],
    )

    return NextResponse.json({
      success: true,
      reactions: updatedComment.rows[0],
    })
  } catch (error) {
    console.error("Error handling comment reaction:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
