"use client";

import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { useEffect, useMemo, useRef, useState } from "react";

interface Post {
  id: number;
  userId: number;
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
  };
}

const PAGE_SIZE = 15;

export function Feed({ isGuest }: { isGuest: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userIdFetched, setUserIdFetched] = useState(false);
  const [userInteractions, setUserInteractions] = useState<
    Record<number, string | null>
  >({});

  // Para saber rápido qué IDs ya tenemos en el client
  const postIds = useMemo(() => new Set(posts.map((p) => p.id)), [posts]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCurrentUserId();
  }, []);

  useEffect(() => {
    if (userIdFetched) {
      loadInitial();
    }
  }, [userIdFetched, currentUserId]);

  async function getCurrentUserId() {
    try {
      if (!isGuest) {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const user = await response.json();
          setCurrentUserId(user.id);
        }
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    } finally {
      setUserIdFetched(true);
    }
  }

  // Auto "infinite scroll" cuando aparece el sentinel en viewport
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(loadMoreRef.current);
    return () => io.disconnect();
  }, [hasMore, isLoadingMore, loading]);

  async function loadInitial() {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/posts?limit=${PAGE_SIZE}&offset=0${
        currentUserId ? `&current_user_id=${currentUserId}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar los posts");

      const data: any[] = await res.json();
      const postsWithHidden = data.map((post: any) => ({
        ...post,
        hidden_data: post.hidden_data ?? null,
      })) as Post[];

      setPosts(postsWithHidden);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError("Error al cargar los posts. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshFeed() {
    // Trae la primera página y PREPEND solo los que no están
    try {
      setIsRefreshing(true);
      const url = `/api/posts?limit=${PAGE_SIZE}&offset=0${
        currentUserId ? `&current_user_id=${currentUserId}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al actualizar");

      const data: any[] = await res.json();
      const normalized = data.map((p: any) => ({
        ...p,
        hidden_data: p.hidden_data ?? null,
      })) as Post[];
      // Solo los nuevos (no repetir los ya existentes)
      const onlyNew = normalized.filter((p) => !postIds.has(p.id));
      if (onlyNew.length > 0) {
        setPosts((prev) => [...onlyNew, ...prev]);
      }
      // Si devolvió menos que PAGE_SIZE, podría significar que no hay tantos nuevos, pero no afecta hasMore
    } catch (e) {
      console.error(e);
      setError("No se pudo actualizar el feed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function loadMore() {
    if (!hasMore) return;
    try {
      setIsLoadingMore(true);
      const url = `/api/posts?limit=${PAGE_SIZE}&offset=${posts.length}${
        currentUserId ? `&current_user_id=${currentUserId}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar más");

      const data: any[] = await res.json();
      const normalized = data.map((p: any) => ({
        ...p,
        hidden_data: p.hidden_data ?? null,
      })) as Post[];
      setPosts((prev) => [...prev, ...normalized]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar más contenido.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const handlePostCreated = () => {
    // al crear un post, refrescamos arriba
    refreshFeed();
  };

  const handlePostInteraction = async (
    postId: number,
    interactionType: string,
  ) => {
    const prevInteraction = userInteractions[postId] || null;

    try {
      // 🧮 Actualizar optimísticamente en UI
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;

          const updated = { ...post };

          // Si ya tenía una interacción anterior, la revertimos
          if (prevInteraction) {
            switch (prevInteraction) {
              case "confirm":
                updated.confirms -= 1;
                break;
              case "agree":
                updated.agrees -= 1;
                break;
              case "disagree":
                updated.disagrees -= 1;
                break;
            }
          }

          // Si hace clic en la misma interacción, simplemente la quita
          if (prevInteraction === interactionType) {
            setUserInteractions((prev) => ({ ...prev, [postId]: null }));
            return updated;
          }

          // Agregamos la nueva
          switch (interactionType) {
            case "confirm":
              updated.confirms += 1;
              break;
            case "agree":
              updated.agrees += 1;
              break;
            case "disagree":
              updated.disagrees += 1;
              break;
            case "share":
              updated.shares += 1;
              break;
          }

          setUserInteractions((prev) => ({
            ...prev,
            [postId]: interactionType,
          }));
          return updated;
        }),
      );
    } catch (error) {
      console.error("Error handling post interaction:", error);
    }

    // 🚀 Llamada al backend
    try {
      const response = await fetch(`/api/posts/${postId}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactionType }),
      });

      if (!response.ok) {
        console.error("Error interacting with post");
      }
    } catch (error) {
      console.error("Error interacting with post:", error);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 lg:max-w-2xl mx-auto p-4 space-y-6">
        <CreatePost onPostCreated={handlePostCreated} isGuest={isGuest}/>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-4 animate-pulse"
            >
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 lg:max-w-2xl mx-auto p-4 space-y-6">
        <CreatePost onPostCreated={handlePostCreated} isGuest={isGuest}/>
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadInitial}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 lg:max-w-2xl mx-auto p-2 space-y-6">
      <CreatePost onPostCreated={handlePostCreated} isGuest={isGuest}/>
      {/* <div className="flex items-center justify-between gap-2">
        <CreatePost onPostCreated={handlePostCreated} />
        <button
          onClick={refreshFeed}
          disabled={isRefreshing}
          className="h-10 px-3 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isRefreshing ? "Actualizando…" : "Actualizar feed"}
        </button>
      </div> */}

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onInteraction={handlePostInteraction}
              userInteractions={userInteractions}
              isGuest={isGuest}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay posts aún
              </h3>
              <p className="text-gray-600 mb-4">
                ¡Sé el primero en compartir algo! Crea un post sobre algún
                candidato político.
              </p>
              <div className="text-sm text-gray-500">
                💡 Tip: Selecciona un candidato para hacer tu post más relevante
              </div>
            </div>
          </div>
        )}
      </div>

      {posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={isLoadingMore || !hasMore}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {isLoadingMore
              ? "Cargando…"
              : hasMore
                ? "Cargar más"
                : "No hay más publicaciones"}
          </button>
        </div>
      )}

      {/* Sentinel para auto-infinite scroll (opcional) */}
      <div ref={loadMoreRef} />
    </main>
  );
}
