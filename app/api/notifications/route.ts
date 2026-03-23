export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getNotifications, markAllNotificationsAsRead, getUnreadNotificationsCount } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const notifications = await getNotifications(currentUser.id)
    const unreadCount = await getUnreadNotificationsCount(currentUser.id)

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await markAllNotificationsAsRead(currentUser.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
