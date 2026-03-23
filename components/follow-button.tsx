"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/app/actions/follow"
import { UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  targetUserId: number
  initialIsFollowing: boolean
  className?: string
}

export function FollowButton({ targetUserId, initialIsFollowing, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    setIsLoading(true)

    try {
      if (isFollowing) {
        const result = await unfollowUser(targetUserId)
        if (result.success) {
          setIsFollowing(false)
        }
      } else {
        const result = await followUser(targetUserId)
        if (result.success) {
          setIsFollowing(true)
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={className}
    >
      {isLoading ? (
        "..."
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Dejar de seguir
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Seguir
        </>
      )}
    </Button>
  )
}
