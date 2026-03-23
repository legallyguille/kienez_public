"use client"

import { useState, useEffect } from "react"
import { Bell, Check, MessageCircle, ThumbsUp, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import type { Notification } from "@/lib/notifications"
import { no } from "zod/v4/locales"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      })
      if (response.ok) {
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const getNotificationIcon = (type: string, reactionType?: string) => {
    if (type === "new_comment") {
      return <MessageCircle className="w-4 h-4 text-blue-500" />
    }
    if (type === "post_reaction" || type === "comment_reaction") {
      if (reactionType === "confirm") {
        return <CheckCircle className="w-4 h-4 text-green-500" />
      }
      if (reactionType === "agree") {
        return <ThumbsUp className="w-4 h-4 text-blue-500" />
      }
      if (reactionType === "disagree") {
        return <ThumbsUp className="w-4 h-4 text-red-500 rotate-180" />
      }
    }
    return <Bell className="w-4 h-4 text-gray-500" />
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={isLoading} className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No tienes notificaciones</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-0">
                {notification.type == "comment_reaction" ? (
                  <Link
                    href={notification.comment_id ? `/comments/${notification.comment_id}` : "#"}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 ${
                      !notification.is_read ? "bg-blue-50" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notification.actor_avatar || undefined} />
                      <AvatarFallback>{notification.actor_name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type, notification.reaction_type)}
                        <span className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</span>
                        {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-800 leading-tight">{notification.message}</p>
                    </div>
                  </Link>
                ):(
                  <Link
                    href={notification.post_id ? `/posts/${notification.post_id}` : "#"}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 ${
                      !notification.is_read ? "bg-blue-50" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notification.actor_avatar || undefined} />
                      <AvatarFallback>{notification.actor_name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type, notification.reaction_type)}
                        <span className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</span>
                        {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-800 leading-tight">{notification.message}</p>
                    </div>
                  </Link>
                )}
                
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
