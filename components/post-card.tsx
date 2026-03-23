"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Share,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CommentSection from "@/components/comment-section";

interface Post {
  id: number;
  userId: number; // Agregar esta línea
  author: string;
  username: string;
  hidden_data: boolean;
  profileImageUrl: string;
  avatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  confirms: number;
  agrees: number;
  disagrees: number;
  shares: number;
  comments: number;
  isShared: boolean;
  originalAuthor?: string;
  originalContent?: string;
  contentType: "hecho" | "opinion" | "rumor";
  candidate?: {
    name: string;
    party: string;
    type: string;
    id?: string;
  };
}

interface PostCardProps {
  post: Post;
  onInteraction?: (postId: number, interactionType: string) => void;
  userInteractions?: Record<number, string | null>;
  isGuest: boolean;
}

export function PostCard({
  post,
  onInteraction,
  userInteractions = {},
  isGuest,
}: PostCardProps) {
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    alias: string;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editingPost, setEditingPost] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportingPost, setReportingPost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [tooltip, setTooltip] = useState<{ type: string; visible: boolean }>({
    type: "",
    visible: false,
  });

  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      if (!isGuest) {
        const response = await fetch("/api/user/current");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
    setIsScrolling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // If movement is more than 10px in any direction, consider it scrolling
    if (deltaX > 10 || deltaY > 10) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = () => {
    // Reset after a short delay to allow for tap detection
    setTimeout(() => {
      setTouchStart(null);
      setIsScrolling(false);
    }, 100);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    if (isScrolling) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return;
    }

    setDeletingPost(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error al eliminar la publicación. Por favor, intenta de nuevo.");
    } finally {
      setDeletingPost(false);
    }
  };

  const handleEditPost = async () => {
    if (!editContent.trim()) {
      alert("El contenido no puede estar vacío");
      return;
    }

    setEditingPost(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error al editar: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Error al editar la publicación. Por favor, intenta de nuevo.");
    } finally {
      setEditingPost(false);
    }
  };

  const handleReportPost = async () => {
    if (!reportReason) {
      alert("Por favor selecciona una razón para el reporte");
      return;
    }

    setReportingPost(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          reason: reportReason,
          description: reportDescription.trim(),
        }),
      });

      if (response.ok) {
        setReportDialogOpen(false);
        setReportReason("");
        setReportDescription("");
        //alert("Reporte enviado exitosamente. Gracias por ayudar a mantener la comunidad segura.")
      } else {
        const errorData = await response.json();
        alert(`Error al reportar: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      alert("Error al enviar el reporte. Por favor, intenta de nuevo.");
    } finally {
      setReportingPost(false);
    }
  };

  const handleInteraction = (interactionType: string) => {
    if (onInteraction) {
      onInteraction(post.id, interactionType);
    }
  };

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              {post.hidden_data ? (
                <>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${post.userId}`}>
                      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage
                          src={
                            post.profileImageUrl ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt="Foto de perfil"
                        />
                        <AvatarFallback>{post.avatar}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      href={`/profile/${post.userId}`}
                      className="font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {post.username}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500">{post.timestamp}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${post.userId}`}>
                      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage
                          src={
                            post.profileImageUrl ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt="Foto de perfil"
                        />
                        <AvatarFallback>{post.avatar}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      href={`/profile/${post.userId}`}
                      className="font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {post.author}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500">
                    <Link
                      href={`/profile/${post.userId}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.username}
                    </Link>{" "}
                    • {post.timestamp}
                  </p>
                </>
              )}
              {post.isShared && post.originalAuthor && (
                <Badge variant="secondary" className="mt-1">
                  Compartido de {post.originalAuthor}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-3"
                    ref={dropdownRef}
                    variant="ghost"
                    size="sm"
                    disabled={loadingUser}
                    onClick={handleDropdownClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {currentUser && post.username === `@${currentUser.alias}` ? (
                    <>
                      <Dialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar publicación
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar publicación</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-content">Contenido</Label>
                              <Textarea
                                id="edit-content"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[100px]"
                                maxLength={2000}
                              />
                              <div className="text-right text-xs text-gray-500 mt-1">
                                {editContent.length}/2000
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setEditDialogOpen(false)}
                                disabled={editingPost}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleEditPost}
                                disabled={
                                  editingPost ||
                                  !editContent.trim() ||
                                  editContent.length > 2000
                                }
                              >
                                {editingPost
                                  ? "Guardando..."
                                  : "Guardar cambios"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleDeletePost}
                        disabled={deletingPost}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingPost
                          ? "Eliminando..."
                          : "Eliminar publicación"}
                      </DropdownMenuItem>
                    </>
                  ) : currentUser ? (
                    <>
                      <Dialog
                        open={reportDialogOpen}
                        onOpenChange={setReportDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Reportar publicación
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reportar publicación</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="report-reason">
                                Razón del reporte
                              </Label>
                              <Select
                                value={reportReason}
                                onValueChange={setReportReason}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una razón" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spam">
                                    Spam o contenido repetitivo
                                  </SelectItem>
                                  <SelectItem value="harassment">
                                    Acoso o bullying
                                  </SelectItem>
                                  <SelectItem value="hate-speech">
                                    Discurso de odio
                                  </SelectItem>
                                  <SelectItem value="misinformation">
                                    Información falsa
                                  </SelectItem>
                                  <SelectItem value="violence">
                                    Contenido violento
                                  </SelectItem>
                                  <SelectItem value="inappropriate">
                                    Contenido inapropiado
                                  </SelectItem>
                                  <SelectItem value="copyright">
                                    Violación de derechos de autor
                                  </SelectItem>
                                  <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="report-description">
                                Descripción adicional (opcional)
                              </Label>
                              <Textarea
                                id="report-description"
                                value={reportDescription}
                                onChange={(e) =>
                                  setReportDescription(e.target.value)
                                }
                                placeholder="Proporciona más detalles sobre el problema..."
                                className="min-h-[80px]"
                                maxLength={500}
                              />
                              <div className="text-right text-xs text-gray-500 mt-1">
                                {reportDescription.length}/500
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReportDialogOpen(false);
                                  setReportReason("");
                                  setReportDescription("");
                                }}
                                disabled={reportingPost}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleReportPost}
                                disabled={reportingPost || !reportReason}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {reportingPost
                                  ? "Enviando..."
                                  : "Enviar reporte"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <DropdownMenuItem disabled className="text-gray-400">
                      Inicia sesión para más opciones
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {post.candidate && (
              <div
                className={`border rounded-lg p-3 mb-3 ${
                  post.contentType === "opinion"
                    ? "bg-blue-50 border-blue-200"
                    : post.contentType === "hecho"
                      ? "bg-green-50 border-green-200"
                      : post.contentType === "rumor"
                        ? "bg-orange-50 border-orange-200"
                        : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={
                      post.contentType === "opinion"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : post.contentType === "hecho"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : post.contentType === "rumor"
                            ? "bg-orange-100 text-orange-600 border-orange-300"
                            : ""
                    }
                  >
                    {post.candidate.type.charAt(0).toUpperCase() +
                      post.candidate.type.slice(1)}
                  </Badge>
                  <div className="flex flex-col lg:flex-row items-center space-x-1">
                    <Link
                      // href={`/candidates/${post.candidate.id || "#"}`}
                      href={`/candidates/${post.candidate.id || "#"}?isGuest=${isGuest}`}
                      className="text-sm font-medium text-blue-900 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {post.candidate.name}
                    </Link>
                    <span className="text-sm text-blue-700">
                      ({post.candidate.party})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {post.isShared && post.originalContent && (
              <div className="bg-gray-50 border-l-4 border-gray-300 pl-4 py-2 mb-3">
                <p className="text-gray-700 italic">"{post.originalContent}"</p>
                <p className="text-xs text-gray-500 mt-1">
                  - {post.originalAuthor}
                </p>
              </div>
            )}

            <p className="text-gray-800 leading-relaxed">
              {renderContentWithLinks(post.content)}
            </p>

            {post.imageUrl && (
              <div className="mt-3">
                <img
                  src={post.imageUrl || "/placeholder.svg"}
                  alt="Imagen del post"
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}

            {post.videoUrl && (
              <div className="mt-3">
                <video
                  src={post.videoUrl}
                  controls
                  className="rounded-lg max-w-full h-auto"
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
            )}

            <div className="flex items-center space-x-1 pt-2">
              <Button
                //variant="ghost"
                disabled={isGuest}
                variant={
                  userInteractions[post.id] === "confirm"
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                className="flex items-center space-x-2 hover:bg-green-50 hover:text-green-700 relative"
                onClick={() => {
                  handleInteraction("confirm");
                  setTooltip({ type: "confirm", visible: true });
                  setTimeout(
                    () => setTooltip({ type: "", visible: false }),
                    2000,
                  );
                }}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden lg:inline md:inline">Confirmo</span>
                <span>({post.confirms})</span>
                {tooltip.visible && tooltip.type === "confirm" && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow z-10">
                    Confirmo
                  </span>
                )}
              </Button>
              <Button
                //variant="ghost"
                disabled={isGuest}
                variant={
                  userInteractions[post.id] === "agree" ? "secondary" : "ghost"
                }
                size="sm"
                className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-700 relative"
                onClick={() => {
                  handleInteraction("agree");
                  setTooltip({ type: "agree", visible: true });
                  setTimeout(
                    () => setTooltip({ type: "", visible: false }),
                    2000,
                  );
                }}
              >
                {/* <Ear className="w-4 h-4" /> */}
                <ThumbsUp className="w-4 h-4" />
                <span className="hidden lg:inline md:inline">Coincido</span>
                <span>({post.agrees})</span>
                {tooltip.visible && tooltip.type === "agree" && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow z-10">
                    Coincido
                  </span>
                )}
              </Button>
              <Button
                //variant="ghost"
                disabled={isGuest}
                variant={
                  userInteractions[post.id] === "disagree"
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-700 relative"
                onClick={() => {
                  handleInteraction("disagree");
                  setTooltip({ type: "disagree", visible: true });
                  setTimeout(
                    () => setTooltip({ type: "", visible: false }),
                    2000,
                  );
                }}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="hidden lg:inline md:inline">Desacuerdo</span>
                <span>({post.disagrees})</span>
                {tooltip.visible && tooltip.type === "disagree" && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow z-10">
                    Desacuerdo
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="w-4 h-4" />
                {/* <span className="hidden lg:inline">Comentar</span> */}
                {post.comments > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                    {post.comments}
                  </span>
                )}
              </Button>
              <Button
                disabled={isGuest}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => handleInteraction("share")}
              >
                <Share className="w-4 h-4" />
                {/* <span className="hidden lg:inline">Compartir</span> */}
                {post.shares > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                    {post.shares}
                  </span>
                )}
              </Button>
            </div>

            {showComments && (
              <CommentSection
                postId={post.id}
                initialCommentsCount={post.comments}
                isGuest={isGuest}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
