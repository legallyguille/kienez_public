"use server"

import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function followUser(targetUserId: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    if (currentUser.id === targetUserId) {
      return { success: false, error: "No puedes seguirte a ti mismo" }
    }

    const sql = await getPool()

    // Verificar si ya sigue al usuario
    const existingFollow = await sql.query("SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2", [
      currentUser.id,
      targetUserId,
    ])

    if (existingFollow.rows.length > 0) {
      return { success: false, error: "Ya sigues a este usuario" }
    }

    // Iniciar transacción
    await sql.query("BEGIN")

    try {
      // Crear la relación de seguimiento
      await sql.query("INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)", [
        currentUser.id,
        targetUserId,
      ])

      // Actualizar contadores
      await sql.query("UPDATE users SET following_count = following_count + 1 WHERE id = $1", [currentUser.id])

      await sql.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetUserId])

      await sql.query("COMMIT")

      revalidatePath("/")
      revalidatePath(`/profile/${targetUserId}`)

      return { success: true }
    } catch (error) {
      await sql.query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, error: "Error al seguir usuario" }
  }
}

export async function unfollowUser(targetUserId: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const sql = await getPool()

    // Verificar si sigue al usuario
    const existingFollow = await sql.query("SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2", [
      currentUser.id,
      targetUserId,
    ])

    if (existingFollow.rows.length === 0) {
      return { success: false, error: "No sigues a este usuario" }
    }

    // Iniciar transacción
    await sql.query("BEGIN")

    try {
      // Eliminar la relación de seguimiento
      await sql.query("DELETE FROM followers WHERE follower_id = $1 AND following_id = $2", [
        currentUser.id,
        targetUserId,
      ])

      // Actualizar contadores
      await sql.query("UPDATE users SET following_count = following_count - 1 WHERE id = $1", [currentUser.id])

      await sql.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetUserId])

      await sql.query("COMMIT")

      revalidatePath("/")
      revalidatePath(`/profile/${targetUserId}`)

      return { success: true }
    } catch (error) {
      await sql.query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, error: "Error al dejar de seguir usuario" }
  }
}

export async function getFollowStatus(targetUserId: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { isFollowing: false }
    }

    const sql = await getPool()
    const result = await sql.query("SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2", [
      currentUser.id,
      targetUserId,
    ])

    return { isFollowing: result.rows.length > 0 }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return { isFollowing: false }
  }
}

export async function getFollowCounts(userId: number) {
  try {
    const sql = await getPool()
    const result = await sql.query("SELECT followers_count, following_count FROM users WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return { followers: 0, following: 0 }
    }

    return {
      followers: result.rows[0].followers_count || 0,
      following: result.rows[0].following_count || 0,
    }
  } catch (error) {
    console.error("Error getting follow counts:", error)
    return { followers: 0, following: 0 }
  }
}
