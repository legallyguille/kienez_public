"use client"

import { PostCard } from "@/components/post-card"
import { useState } from "react"

interface Post {
  id: number
  userId: number
  author: string
  username: string
  hidden_data: boolean
  profileImageUrl: string
  avatar: string
  content: string
  imageUrl?: string
  videoUrl?: string
  timestamp: string
  confirms: number
  agrees: number
  disagrees: number
  shares: number
  comments: number
  isShared: boolean
  originalAuthor?: string
  originalContent?: string
  candidate?: {
    name: string
    party: string
    type: string
    id?: string
  }
  contentType: "hecho" | "opinion" | "rumor"
}

interface SinglePostViewProps {
  initialPost: Post
}

export function SinglePostView({ initialPost }: SinglePostViewProps) {
  const [post, setPost] = useState<Post>(initialPost)

  const handlePostInteraction = async (postId: number, interactionType: string) => {
    try {
      setPost((prevPost) => {
        const updatedPost = { ...prevPost }
        switch (interactionType) {
          case "confirm":
            updatedPost.confirms += 1
            break
          case "agree":
            updatedPost.agrees += 1
            break
          case "disagree":
            updatedPost.disagrees += 1
            break
          case "share":
            updatedPost.shares += 1
            break
        }
        return updatedPost
      })

      const response = await fetch(`/api/posts/${postId}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactionType }),
      })

      if (!response.ok) {
        setPost((prevPost) => {
          const revertedPost = { ...prevPost }
          switch (interactionType) {
            case "confirm":
              revertedPost.confirms -= 1
              break
            case "agree":
              revertedPost.agrees -= 1
              break
            case "disagree":
              revertedPost.disagrees -= 1
              break
            case "share":
              revertedPost.shares -= 1
              break
          }
          return revertedPost
        })
        console.error("Error interacting with post")
      }
    } catch (error) {
      console.error("Error interacting with post:", error)
      setPost((prevPost) => {
        const revertedPost = { ...prevPost }
        switch (interactionType) {
          case "confirm":
            revertedPost.confirms -= 1
            break
          case "agree":
            revertedPost.agrees -= 1
            break
          case "disagree":
            revertedPost.disagrees -= 1
            break
          case "share":
            revertedPost.shares -= 1
            break
        }
        return revertedPost
      })
    }
  }

  return <PostCard post={post} onInteraction={handlePostInteraction} />
}
