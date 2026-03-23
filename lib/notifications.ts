import { getPool } from "@/lib/db"

export interface Notification {
  id: number
  user_id: number
  actor_id: number
  type: "post_reaction" | "comment_reaction" | "new_comment"
  post_id?: number
  comment_id?: number
  reaction_type?: string
  message: string
  is_read: boolean
  created_at: string
  actor_name: string
  actor_username: string
  actor_avatar: string
}

export async function createNotification({
  userId,
  actorId,
  type,
  postId,
  commentId,
  reactionType,
  message,
}: {
  userId: number
  actorId: number
  type: "post_reaction" | "comment_reaction" | "new_comment"
  postId?: number
  commentId?: number
  reactionType?: string
  message: string
}) {
  // No crear notificación si el actor es el mismo usuario
  if (userId === actorId) return

  try {
    const sql = await getPool()
    await sql.query(
      `
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, reaction_type, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [userId, actorId, type, postId || null, commentId || null, reactionType || null, message],
    )
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function getNotifications(userId: number, limit = 20): Promise<Notification[]> {
  try {
    const sql = await getPool()
    const result = await sql.query(
      `
      SELECT 
      n.*,
      u.nombre || ' ' || u.apellido as actor_name,
      u.alias as actor_username
      --pi.image_data as actor_avatar
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      --JOIN profile_images pi ON u.profile_image_id = pi.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2
    `,
      [userId, limit],
    )

    // Mostrar en consola el array de resultados
    //console.log('notifications:', result.rows)

    return result.rows
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  try {
    const sql = await getPool()
    await sql.query(
      `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
    `,
      [notificationId, userId],
    )
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  try {
    const sql = await getPool()
    await sql.query(
      `
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
    `,
      [userId],
    )
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
  }
}

export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  try {
    const sql = await getPool()
    const result = await sql.query(
      `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `,
      [userId],
    )

    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return 0
  }
}
