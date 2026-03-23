import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserLinkProps {
  userId: number
  username: string
  displayName: string
  avatar?: string
  showAvatar?: boolean
  className?: string
  avatarSize?: "sm" | "md" | "lg"
}

export function UserLink({
  userId,
  username,
  displayName,
  avatar,
  showAvatar = false,
  className = "",
  avatarSize = "md",
}: UserLinkProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  return (
    <Link href={`/profile/${userId}`} className={`hover:text-blue-600 transition-colors cursor-pointer ${className}`}>
      <div className="flex items-center space-x-2">
        {showAvatar && (
          <Avatar className={`${sizeClasses[avatarSize]} hover:opacity-80 transition-opacity`}>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="text-xs">
              {avatar ||
                displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
            </AvatarFallback>
          </Avatar>
        )}
        <span>{displayName}</span>
      </div>
    </Link>
  )
}
