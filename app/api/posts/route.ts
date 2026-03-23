export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { se } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const candidateId = searchParams.get("candidate_id")
    const postType = searchParams.get("type") // 'original', 'share', o null para todos
    const limit = Number(searchParams.get("limit")) || 20
    const offset = Number(searchParams.get("offset")) || 0
    const currentUserId = searchParams.get("current_user_id")

    let posts
    if (userId) {
      // Obtener posts de un usuario específico
      let typeCondition = ""
      if (postType === "original") {
        typeCondition = "AND p.post_type = 'original'"
      } else if (postType === "share") {
        typeCondition = "AND p.post_type = 'share'"
      }

      const sql = await getPool()
      posts = await sql.query(
        `
        SELECT 
          p.id, p.content, p.image_url, p.video_url, p.post_type, p.original_post_id,
          p.confirms, p.agrees, p.disagrees, p.shares, p.comments, p.created_at,
          p.es_hecho, p.es_opinion, p.es_rumor,
          u.id as user_id, u.nombre, u.apellido, u.alias, u.datos_ocultos, 
          pi.image_data as profile_image_url,
          pimg.image_data as post_image_data,
          c.id as candidate_id, c.nombre as candidate_name, c.partido as candidate_party, c.tipo_candidatura,
          op.content as original_content,
          ou.nombre as original_author_name, ou.apellido as original_author_lastname, ou.alias as original_author_alias
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN candidates c ON p.candidate_id = c.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        LEFT JOIN profile_images pi ON u.id = pi.user_id
        LEFT JOIN post_images pimg ON p.image_url::integer = pimg.id
        WHERE p.user_id = $1 AND p.is_active = true ${typeCondition}
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset],
      )
    } else if (candidateId) {
      // Obtener posts relacionados con un candidato específico
      const sql = await getPool()
      posts = await sql.query(
        `
        SELECT 
          p.id, p.content, p.image_url, p.video_url, p.post_type, p.original_post_id,
          p.confirms, p.agrees, p.disagrees, p.shares, p.comments, p.created_at,
          p.es_hecho, p.es_opinion, p.es_rumor,
          u.id as user_id, u.nombre, u.apellido, u.alias, u.datos_ocultos,
          pi.image_data as profile_image_url,
          pimg.image_data as post_image_data,
          c.id as candidate_id, c.nombre as candidate_name, c.partido as candidate_party, c.tipo_candidatura,
          op.content as original_content,
          ou.nombre as original_author_name, ou.apellido as original_author_lastname, ou.alias as original_author_alias
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN candidates c ON p.candidate_id = c.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        LEFT JOIN profile_images pi ON u.id = pi.user_id
        LEFT JOIN post_images pimg ON p.image_url::integer = pimg.id
        WHERE p.candidate_id = $1 AND p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [candidateId, limit, offset],
      )
    } else {
      // Obtener todos los posts (feed general)
      const sql = await getPool()

      if (currentUserId) {
        // Feed personalizado: primero posts de usuarios seguidos, luego el resto
        posts = await sql.query(
        `
        SELECT 
          p.id, p.content, p.image_url, p.video_url, p.post_type, p.original_post_id,
          p.confirms, p.agrees, p.disagrees, p.shares, p.comments, p.created_at,
          p.es_hecho, p.es_opinion, p.es_rumor,
          u.id as user_id, u.nombre, u.apellido, u.alias, u.datos_ocultos,
          pi.image_data as profile_image_url,
          pimg.image_data as post_image_data,
          c.id as candidate_id, c.nombre as candidate_name, c.partido as candidate_party, c.tipo_candidatura,
          op.content as original_content,
          ou.nombre as original_author_name, ou.apellido as original_author_lastname, ou.alias as original_author_alias,
          CASE 
            WHEN f.follower_id IS NOT NULL THEN 1 
            ELSE 0 
          END as is_from_followed_user,
          -- Nueva columna para identificar posts recientes de usuarios seguidos
          CASE 
            WHEN f.follower_id IS NOT NULL AND p.created_at >= NOW() - INTERVAL '2 days' THEN 1
            ELSE 0
          END as is_recent_followed_post
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN candidates c ON p.candidate_id = c.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        LEFT JOIN profile_images pi ON u.id = pi.user_id
        LEFT JOIN post_images pimg ON p.image_url::integer = pimg.id
        LEFT JOIN followers f ON f.following_id = p.user_id AND f.follower_id = $3
        WHERE p.is_active = true
        ORDER BY 
          is_recent_followed_post DESC,  -- Primero posts recientes de seguidos
          p.created_at DESC              -- Luego por fecha descendente
        LIMIT $1 OFFSET $2
        `,
          [limit, offset, currentUserId],
        )
      } else {
        // Feed general sin personalización
        posts = await sql.query(
          `
          SELECT 
            p.id, p.content, p.image_url, p.video_url, p.post_type, p.original_post_id,
            p.confirms, p.agrees, p.disagrees, p.shares, p.comments, p.created_at,
            p.es_hecho, p.es_opinion, p.es_rumor,
            u.id as user_id, u.nombre, u.apellido, u.alias, u.datos_ocultos,
            pi.image_data as profile_image_url,
            pimg.image_data as post_image_data,
            c.id as candidate_id, c.nombre as candidate_name, c.partido as candidate_party, c.tipo_candidatura,
            op.content as original_content,
            ou.nombre as original_author_name, ou.apellido as original_author_lastname, ou.alias as original_author_alias
          FROM posts p
          JOIN users u ON p.user_id = u.id
          LEFT JOIN candidates c ON p.candidate_id = c.id
          LEFT JOIN posts op ON p.original_post_id = op.id
          LEFT JOIN users ou ON op.user_id = ou.id
          LEFT JOIN profile_images pi ON u.id = pi.user_id
          LEFT JOIN post_images pimg ON p.image_url::integer = pimg.id
          WHERE p.is_active = true
          ORDER BY p.created_at DESC
          LIMIT $1 OFFSET $2
        `,
          [limit, offset],
        )
      }
    }

    // Formatear los posts para el frontend
    const formattedPosts = posts.rows.map((post) => ({
      id: post.id,
      userId: post.user_id,
      author: `${post.nombre} ${post.apellido}`,
      username: `@${post.alias}`,
      hidden_data: post.datos_ocultos,
      profileImageUrl: post.profile_image_url,
      avatar: `${post.nombre.charAt(0)}${post.apellido.charAt(0)}`,
      content: post.content,
      imageUrl: post.post_image_data, // Ahora contiene la imagen base64 real
      videoUrl: post.video_url,
      timestamp: formatTimestamp(post.created_at),
      confirms: post.confirms,
      agrees: post.agrees,
      disagrees: post.disagrees,
      shares: post.shares,
      comments: post.comments,
      isShared: post.post_type === "share",
      contentType: post.es_hecho ? "hecho" : post.es_opinion ? "opinion" : "rumor",
      originalAuthor:
        post.original_author_name && post.original_author_lastname
          ? `${post.original_author_name} ${post.original_author_lastname}`
          : null,
      originalAuthorUsername: post.original_author_alias ? `@${post.original_author_alias}` : null,
      originalContent: post.original_content,
      candidate: post.candidate_name
        ? {
            id: post.candidate_id,
            name: post.candidate_name,
            party: post.candidate_party,
            type: post.tipo_candidatura,
          }
        : null,
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const postDate = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return "Ahora"
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`
  } else if (diffInMinutes < 1440) {
    // 24 horas
    const hours = Math.floor(diffInMinutes / 60)
    return `Hace ${hours} hora${hours !== 1 ? "s" : ""}`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `Hace ${days} día${days !== 1 ? "s" : ""}`
  }
}
