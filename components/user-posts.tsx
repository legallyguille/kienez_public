"use client";

import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { set } from "date-fns";
import { useState, useEffect, useMemo, useRef } from "react";

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
  };
}

interface UserPostsProps {
  userId: number;
}

const PAGE_SIZE = 5;

export function UserPosts({ userId }: UserPostsProps) {
  const [originalPosts, setOriginalPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userInteractions, setUserInteractions] = useState<
    Record<number, string | null>
  >({});

  // Para saber rápido qué IDs ya tenemos en el client
  const postIds = useMemo(
    () => new Set(originalPosts.map((p) => p.id)),
    [originalPosts]
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    //loadUserPosts()
    loadInitial();
  }, [userId]);

  // (Opcional) Auto "infinite scroll" cuando aparece el sentinel en viewport
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(loadMoreRef.current);
    return () => io.disconnect();
  }, [hasMore, isLoadingMore, loading]);

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar posts originales del usuario
      const originalResponse = await fetch(
        `/api/posts?user_id=${userId}&type=original&limit=${PAGE_SIZE}&offset=0`
      );
      if (!originalResponse.ok) {
        throw new Error("Error al cargar posts originales");
      }
      const originalData = await originalResponse.json();
      setOriginalPosts(originalData);

      // Cargar posts compartidos del usuario
      const sharedResponse = await fetch(
        `/api/posts?user_id=${userId}&type=share`
      );
      if (!sharedResponse.ok) {
        throw new Error("Error al cargar posts compartidos");
      }
      const sharedData = await sharedResponse.json();
      setSharedPosts(sharedData);
    } catch (error) {
      console.error("Error loading user posts:", error);
      setError("Error al cargar los posts. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  async function loadInitial() {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/posts?user_id=${userId}&type=original&limit=${PAGE_SIZE}&offset=0`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar los posts");

      const data: any[] = await res.json();
      const postsWithHidden = data.map((post: any) => ({
        ...post,
        hidden_data: post.hidden_data ?? null,
      })) as Post[];

      setOriginalPosts(postsWithHidden);
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
      const url = `/api/posts?user_id=${userId}&type=original&limit=${PAGE_SIZE}&offset=0`;
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
        setOriginalPosts((prev) => [...onlyNew, ...prev]);
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
      const url = `/api/posts?user_id=${userId}&type=original&limit=${PAGE_SIZE}&offset=${originalPosts.length}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar más");

      const data: any[] = await res.json();
      const normalized = data.map((p: any) => ({
        ...p,
        hidden_data: p.hidden_data ?? null,
      })) as Post[];
      setOriginalPosts((prev) => [...prev, ...normalized]);
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
    interactionType: string
  ) => {
    const prevInteraction = userInteractions[postId] || null;

    try {
      // 🧮 Actualizar optimísticamente en UI
      setOriginalPosts((prevPosts) =>
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
        })
      );
    } catch (error) {
      console.error("Error al manejar la interacción del post:", error);
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

  const allPosts = [...originalPosts, ...sharedPosts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
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
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                // onClick={loadUserPosts}
                onClick={loadInitial}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicaciones</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Todas
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {allPosts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="original" className="flex items-center gap-2">
              Originales
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {originalPosts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              Compartidas
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                {sharedPosts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {allPosts.length > 0 ? (
                allPosts.map((post) => (
                  <PostCard
                    key={`${post.id}-${post.isShared ? "shared" : "original"}`}
                    post={post}
                    onInteraction={handlePostInteraction}
                    userInteractions={userInteractions}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay publicaciones aún
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ¡Comparte tu primera publicación! Crea contenido original
                      o comparte posts interesantes.
                    </p>
                    <div className="text-sm text-gray-500">
                      💡 Tip: Usa el formulario de arriba para crear tu primera
                      publicación
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="original" className="mt-6">
            <div className="space-y-4">
              {originalPosts.length > 0 ? (
                originalPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onInteraction={handlePostInteraction}
                    userInteractions={userInteractions}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      No hay publicaciones originales
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Crea tu primera publicación original sobre algún candidato
                      político.
                    </p>
                    <div className="text-sm text-blue-600">
                      ✍️ Comparte tus opiniones, hechos o análisis políticos
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            <div className="space-y-4">
              {sharedPosts.length > 0 ? (
                sharedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onInteraction={handlePostInteraction}
                    userInteractions={userInteractions}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-green-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      No hay publicaciones compartidas
                    </h3>
                    <p className="text-green-700 mb-4">
                      Cuando compartas publicaciones de otros usuarios,
                      aparecerán aquí.
                    </p>
                    <div className="text-sm text-green-600">
                      🔄 Explora el feed principal y comparte contenido
                      interesante
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {originalPosts.length > 0 && (
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

        {/* Estadísticas del usuario */}
        {/* {(originalPosts.length > 0 || sharedPosts.length > 0) && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Estadísticas de actividad</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{originalPosts.length}</div>
                <div className="text-xs text-blue-700">Posts originales</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{sharedPosts.length}</div>
                <div className="text-xs text-green-700">Posts compartidos</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {allPosts.reduce((sum, post) => sum + post.confirms + post.agrees, 0)}
                </div>
                <div className="text-xs text-purple-700">Reacciones positivas</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {allPosts.reduce((sum, post) => sum + post.shares, 0)}
                </div>
                <div className="text-xs text-orange-700">Veces compartido</div>
              </div>
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
