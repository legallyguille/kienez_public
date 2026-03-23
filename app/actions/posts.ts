"use server"

import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import { limitRequests } from "@/lib/rateLimitPostgres"
import { headers } from "next/headers"

interface CreatePostData {
  content: string
  candidateId?: number
  imageUrl?: string
  videoUrl?: string
  postType?: string
  originalPostId?: number
  contentType?: "hecho" | "opinion" | "rumor"
}

export async function createPost(prevState: any, formData: FormData) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    if(currentUser.active === false){
      return {
        success: false,
        message: "Tu cuenta ha sido desactivada por exceder sospechosamente el límite de publicaciones. Contacta al soporte para más información.",
      };
    }

    const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0];
    const uniqueKey = currentUser ? currentUser.id : 0;
    // 🚦 Aplicar rate limiting (máx. 5 posts por minuto)
    const allowed = await limitRequests(uniqueKey, "/action/createPost", 5, 1);

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

      //console.log(`Usuario ${currentUser.id} desactivado por exceder el límite de posts.`)

      await sql.query(
        `UPDATE posts SET
          is_active = false,
          updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 
          AND created_at >= NOW() - INTERVAL '1 hour';`,
        [currentUser.id],
      )

      //console.log(`Posts del usuario ${currentUser.id} desactivados por exceder el límite de posts.`)

      return {
        success: false,
        message: "Has publicado demasiadas veces en poco tiempo.",
      };
    }

    const websiteField = formData.get("website")

    if (websiteField) {
      // Campo honeypot llenado, posible bot
      return {
        success: false,
        message: "Bot detected. Submission rejected.",
      }
    }


    const postImageFile = formData.get("post-image") as File
    let postImageId: number | null = null

    // Procesar imagen si existe
    if (postImageFile && postImageFile.size > 0) {
      // Validar tamaño (5MB máximo)
      if (postImageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen debe ser menor a 5MB.",
        }
      }

      // Validar tipo de archivo
      if (!postImageFile.type.startsWith("image/")) {
        return {
          success: false,
          message: "Solo se permiten archivos de imagen.",
        }
      }

      try {
        // Convertir imagen a base64
        const bytes = await postImageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64Image = `data:${postImageFile.type};base64,${buffer.toString("base64")}`

        // Insertar imagen en la tabla post_images
        const sql = await getPool()
        const imageResult = await sql.query(
          `INSERT INTO post_images (user_id, image_data, file_name, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [currentUser.id, base64Image, postImageFile.name, postImageFile.size, postImageFile.type],
        )

        postImageId = imageResult.rows[0].id
      } catch (imageError) {
        console.error("Error procesando imagen:", imageError)
        return {
          success: false,
          message: "Error al procesar la imagen. Intenta de nuevo.",
        }
      }
    }

    // Extraer datos del formulario
    const postData: CreatePostData = {
      content: formData.get("content") as string,
      candidateId: formData.get("candidate-id") ? Number(formData.get("candidate-id")) : undefined,
      imageUrl: formData.get("image-url") as string,
      videoUrl: formData.get("video-url") as string,
      postType: (formData.get("post-type") as string) || "original",
      originalPostId: formData.get("original-post-id") ? Number(formData.get("original-post-id")) : undefined,
      contentType: (formData.get("content-type") as "hecho" | "opinion" | "rumor") || "opinion",
    }

    // Validaciones básicas
    if (!postData.content || postData.content.trim().length === 0) {
      return {
        success: false,
        message: "El contenido del post no puede estar vacío.",
      }
    }

    if (postData.content.length > 2000) {
      return {
        success: false,
        message: "El contenido del post no puede exceder 2000 caracteres.",
      }
    }

    // Validar tipo de contenido
    const validContentTypes = ["hecho", "opinion", "rumor"]
    if (!validContentTypes.includes(postData.contentType!)) {
      return {
        success: false,
        message: "Tipo de contenido no válido.",
      }
    }

    // Verificar que el candidato existe si se proporcionó
    if (postData.candidateId) {
      const sql = await getPool()
      const candidateExistsResult = await sql.query("SELECT id FROM candidates WHERE id = $1 AND activo = true", [
        postData.candidateId,
      ])

      if (candidateExistsResult.rows.length === 0) {
        return {
          success: false,
          message: "El candidato seleccionado no existe o no está activo.",
        }
      }
    }

    // Verificar que el post original existe si es un share
    if (postData.postType === "share" && postData.originalPostId) {
      const sql = await getPool()
      const originalPostExistsResult = await sql.query("SELECT id FROM posts WHERE id = $1 AND is_active = true", [
        postData.originalPostId,
      ])

      if (originalPostExistsResult.rows.length === 0) {
        return {
          success: false,
          message: "El post original no existe o no está disponible.",
        }
      }
    }

    // Preparar los valores booleanos para el tipo de contenido
    const esHecho = postData.contentType === "hecho"
    const esOpinion = postData.contentType === "opinion"
    const esRumor = postData.contentType === "rumor"

    const sql = await getPool()
    const result = await sql.query(
      `INSERT INTO posts (
        user_id, candidate_id, content, image_url, video_url, 
        post_type, original_post_id, es_hecho, es_opinion, es_rumor
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      )
      RETURNING id, content, created_at, es_hecho, es_opinion, es_rumor`,
      [
        currentUser.id,
        postData.candidateId || null,
        postData.content.trim(),
        postImageId,
        postData.videoUrl || null,
        postData.postType ?? "original",
        postData.originalPostId || null,
        esHecho,
        esOpinion,
        esRumor,
      ],
    )

    // Si es un share, incrementar el contador del post original
    if (postData.postType === "share" && postData.originalPostId) {
      await sql.query(
        `UPDATE posts SET 
          shares = shares + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [postData.originalPostId],
      )
    }

    const createdPost = result.rows[0]
    const contentTypeLabel = esHecho ? "Hecho" : esOpinion ? "Opinión" : "Rumor"

    // console.log("Post creado exitosamente:", {
    //   id: createdPost.id,
    //   contentType: contentTypeLabel,
    //   content: createdPost.content.substring(0, 50) + "...",
    //   hasImage: !!postImageId,
    // })

    return {
      success: true,
      message: `${contentTypeLabel} publicado exitosamente.`,
      postId: createdPost.id,
    }
  } catch (error) {
    console.error("Error al crear post:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function sharePost(postId: number, shareContent?: string) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Verificar que el post existe y está activo
    const sql = await getPool()
    const originalPost = await sql.query(
      `
      SELECT id, user_id, content FROM posts 
      WHERE id = $1 AND is_active = true
    `,
      [postId],
    )

    if (originalPost.rows.length === 0) {
      return {
        success: false,
        message: "El post no existe o no está disponible.",
      }
    }

    // Verificar que el usuario no esté compartiendo su propio post
    if (originalPost.rows[0].user_id === currentUser.id) {
      return {
        success: false,
        message: "No puedes compartir tu propio post.",
      }
    }

    // Verificar si el usuario ya compartió este post
    const existingShare = await sql.query(
      "SELECT id FROM posts WHERE user_id = $1 AND original_post_id = $2 AND post_type = 'share' AND is_active = true",
      [currentUser.id, postId],
    )

    if (existingShare.rows.length > 0) {
      return {
        success: false,
        message: "Ya has compartido este post anteriormente.",
      }
    }

    // Crear el post compartido (por defecto como opinión)
    const shareResult = await sql.query(
      `INSERT INTO posts (
        user_id, content, post_type, original_post_id, es_opinion
      ) VALUES (
        $1, $2, 'share', $3, true
      )
      RETURNING id, content, created_at
    `,
      [currentUser.id, shareContent || "", postId],
    )

    // Incrementar el contador de shares del post original
    await sql.query(
      `UPDATE posts SET 
        shares = shares + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [postId],
    )

    //console.log("Post compartido exitosamente:", shareResult.rows[0])

    return {
      success: true,
      message: "Post compartido exitosamente.",
      shareId: shareResult.rows[0].id,
    }
  } catch (error) {
    console.error("Error al compartir post:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function interactWithPost(postId: number, interactionType: string) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Validar tipo de interacción
    const validInteractions = ["confirm", "agree", "disagree", "share"]
    if (!validInteractions.includes(interactionType)) {
      return {
        success: false,
        message: "Tipo de interacción no válido.",
      }
    }

    // Si es share, usar la función específica
    if (interactionType === "share") {
      return await sharePost(postId)
    }

    const sql = await getPool()
    const postResult = await sql.query("SELECT id, user_id FROM posts WHERE id = $1 AND is_active = true", [postId])

    if (postResult.rows.length === 0) {
      return {
        success: false,
        message: "El post no existe o no está disponible.",
      }
    }

    const postAuthorId = postResult.rows[0].user_id

    // Verificar si el usuario ya interactuó de esta forma con el post
    const existingInteraction = await sql.query(
      "SELECT id FROM post_interactions WHERE user_id = $1 AND post_id = $2 AND interaction_type = $3",
      [currentUser.id, postId, interactionType],
    )

    if (existingInteraction.rows.length > 0) {
      // Si ya existe, remover la interacción (toggle)
      await sql.query("DELETE FROM post_interactions WHERE user_id = $1 AND post_id = $2 AND interaction_type = $3", [
        currentUser.id,
        postId,
        interactionType,
      ])

      // Decrementar el contador en el post
      const columnName =
        interactionType === "confirm" ? "confirms" : interactionType === "agree" ? "agrees" : "disagrees"

      await sql.query(
        `UPDATE posts SET 
          ${columnName} = GREATEST(${columnName} - 1, 0),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [postId],
      )

      return {
        success: true,
        message: "Interacción removida.",
        action: "removed",
      }
    } else {
      // Remover otras interacciones conflictivas (confirm, agree, disagree son mutuamente excluyentes)
      if (["confirm", "agree", "disagree"].includes(interactionType)) {
        const conflictingTypes = ["confirm", "agree", "disagree"].filter((type) => type !== interactionType)

        for (const conflictType of conflictingTypes) {
          const conflictingInteraction = await sql.query(
            "SELECT id FROM post_interactions WHERE user_id = $1 AND post_id = $2 AND interaction_type = $3",
            [currentUser.id, postId, conflictType],
          )

          if (conflictingInteraction.rows.length > 0) {
            await sql.query(
              "DELETE FROM post_interactions WHERE user_id = $1 AND post_id = $2 AND interaction_type = $3",
              [currentUser.id, postId, conflictType],
            )

            // Decrementar el contador del tipo conflictivo
            const conflictColumnName =
              conflictType === "confirm" ? "confirms" : conflictType === "agree" ? "agrees" : "disagrees"

            await sql.query(
              `UPDATE posts SET
                ${conflictColumnName} = GREATEST(${conflictColumnName} - 1, 0),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
              `,
              [postId],
            )
          }
        }
      }

      // Agregar la nueva interacción
      await sql.query("INSERT INTO post_interactions (user_id, post_id, interaction_type) VALUES ($1, $2, $3)", [
        currentUser.id,
        postId,
        interactionType,
      ])

      // Incrementar el contador en el post
      const columnName =
        interactionType === "confirm" ? "confirms" : interactionType === "agree" ? "agrees" : "disagrees"

      await sql.query(
        "UPDATE posts SET " +
        columnName +
        " = " +
        columnName +
        " + 1, " +
        "updated_at = CURRENT_TIMESTAMP " +
        "WHERE id = $1",
        [postId],
      )

      const reactionLabels = {
        confirm: "confirmó",
        agree: "coincidió con",
        disagree: "está en desacuerdo con",
      }

      console.log("create notification for post interaction", postAuthorId, currentUser.id, postId, interactionType);

      await createNotification({
        userId: postAuthorId,
        actorId: currentUser.id,
        type: "post_reaction",
        postId: postId,
        reactionType: interactionType,
        message: `${currentUser.nombre} ${currentUser.apellido} ${reactionLabels[interactionType as keyof typeof reactionLabels]} tu publicación`,
      })

      return {
        success: true,
        message: "Interacción registrada.",
        action: "added",
      }
    }
  } catch (error) {
    console.error("Error al interactuar con post:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function deletePost(postId: number) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Verificar que el post existe y pertenece al usuario
    const sql = await getPool()
    const post = await sql.query(
      `
      SELECT id, user_id FROM posts
      WHERE id = $1 AND is_active = true
    `,
      [postId],
    )

    if (post.rows.length === 0) {
      return {
        success: false,
        message: "El post no existe o ya fue eliminado.",
      }
    }

    if (post.rows[0].user_id !== currentUser.id) {
      return {
        success: false,
        message: "No tienes permisos para eliminar este post.",
      }
    }

    // Marcar el post como inactivo
    await sql.query(
      `
      UPDATE posts SET
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [postId],
    )

    console.log(`Post ${postId} marcado como inactivo por usuario ${currentUser.id}`)

    return {
      success: true,
      message: "Post eliminado exitosamente.",
    }
  } catch (error) {
    console.error("Error al eliminar post:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}
