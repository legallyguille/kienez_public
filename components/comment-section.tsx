"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: number;
  userId: number;
  postIdFather: number;
  candidateId?: number;
  author: string;
  username: string;
  dataHidden: boolean;
  avatar: string;
  content: string;
  confirms: number;
  agrees: number;
  disagrees: number;
  contentType: "hecho" | "opinion" | "rumor";
  timestamp: string;
  candidate?: {
    name: string;
    party: string;
    type: string;
  };
}

interface CommentSectionProps {
  postId: number;
  initialCommentsCount: number;
  isGuest: boolean;
}

export default function CommentSection({
  postId,
  initialCommentsCount,
  isGuest,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment("");
        setCommentsCount((prev) => prev + 1);
        await fetchComments(); // Recargar comentarios
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (
    commentId: number,
    reactionType: "confirms" | "agrees" | "disagrees",
  ) => {
    try {
      const response = await fetch("/api/comments/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          reactionType,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the comment in the local state
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  confirms: data.reactions.confirms,
                  agrees: data.reactions.agrees,
                  disagrees: data.reactions.disagrees,
                }
              : comment,
          ),
        );
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "hecho":
        return "text-green-600";
      case "opinion":
        return "text-blue-600";
      case "rumor":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "hecho":
        return "Hecho";
      case "opinion":
        return "Opinión";
      case "rumor":
        return "Rumor";
      default:
        return "Contenido";
    }
  };

  return (
    <div className="space-y-4">
      {/*<Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <MessageCircle className="h-4 w-4" />
        {commentsCount} comentario{commentsCount !== 1 ? "s" : ""}
      </Button> */}

      {showComments && (
        <div className="space-y-4 border-t pt-4">
          {!isGuest && (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isLoading}
                  size="sm"
                >
                  {isLoading ? "Publicando..." : "Comentar"}
                </Button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <Link href={`/profile/${comment.userId}`}>
                  <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
                    <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {comment.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {!comment.dataHidden ? (
                      <>
                        <Link
                          href={`/profile/${comment.userId}`}
                          className="font-semibold hover:underline"
                        >
                          {comment.author}
                        </Link>
                        <span className="text-gray-500">
                          @{comment.username}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getContentTypeColor(comment.contentType)} bg-opacity-10`}
                        >
                          {getContentTypeLabel(comment.contentType)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {comment.timestamp}
                        </span>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/profile/${comment.userId}`}
                          className="font-semibold hover:underline"
                        >
                          {comment.username}
                        </Link>
                        {/* <span className="text-gray-500">@{comment.username}</span> */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getContentTypeColor(comment.contentType)} bg-opacity-10`}
                        >
                          {getContentTypeLabel(comment.contentType)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {comment.timestamp}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-gray-800">{comment.content}</p>

                  {comment.candidate && (
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Sobre: {comment.candidate.name} ({comment.candidate.party}
                      )
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <button
                      disabled={isGuest}
                      className="flex items-center gap-1 hover:text-green-600 transition-colors"
                      onClick={() => handleReaction(comment.id, "confirms")}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {comment.confirms}
                    </button>
                    <button
                      disabled={isGuest}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      onClick={() => handleReaction(comment.id, "agrees")}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {comment.agrees}
                    </button>
                    <button
                      disabled={isGuest}
                      className="flex items-center gap-1 hover:text-red-600 transition-colors"
                      onClick={() => handleReaction(comment.id, "disagrees")}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      {comment.disagrees}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
