"use client"

import { PostCard } from "@/components/post-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MessageSquare, Users, BarChart3 } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"

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
  contentType: "hecho" | "opinion" | "rumor"
  candidate?: {
    name: string
    party: string
    type: string
  }
}

interface CandidatePostsProps {
  candidateId: number
  candidateName: string
  isGuest: boolean
}

const PAGE_SIZE = 5

export function CandidatePosts({ candidateId, candidateName, isGuest }: CandidatePostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [userInteractions, setUserInteractions] = useState<Record<number, string | null>>({});

  // Para saber rápido qué IDs ya tenemos en el client
  const postIds = useMemo(() => new Set(posts.map((p) => p.id)), [posts])
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    //loadCandidatePosts()
    loadInitial()
  }, [candidateId])

  // (Opcional) Auto "infinite scroll" cuando aparece el sentinel en viewport
  useEffect(() => {
    if (!loadMoreRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: "300px" },
    )
    io.observe(loadMoreRef.current)
    return () => io.disconnect()
  }, [hasMore, isLoadingMore, loading])

  const loadCandidatePosts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/posts?candidate_id=${candidateId}&limit=${PAGE_SIZE}&offset=0`)
      if (!response.ok) {
        throw new Error("Error al cargar posts del candidato")
      }
      const data = await response.json()
      // Ensure hidden_data exists for each post
      const postsWithHiddenData = data.map((post: any) => ({
        ...post,
        hidden_data: post.hidden_data ?? null,
      }))
      setPosts(postsWithHiddenData)
    } catch (error) {
      console.error("Error loading candidate posts:", error)
      setError("Error al cargar los posts. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function loadInitial() {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/posts?candidate_id=${candidateId}&limit=${PAGE_SIZE}&offset=0`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Error al cargar los posts")

      const data: any[] = await res.json()
      const postsWithHidden = data.map((post: any) => ({
        ...post,
        hidden_data: post.hidden_data ?? null,
      })) as Post[]

      setPosts(postsWithHidden)
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
      setError("Error al cargar los posts. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function refreshFeed() {
    // Trae la primera página y PREPEND solo los que no están
    try {
      setIsRefreshing(true)
      const url = `/api/posts?candidate_id=${candidateId}&limit=${PAGE_SIZE}&offset=0`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Error al actualizar")

      const data: any[] = await res.json()
      const normalized = data.map((p: any) => ({ ...p, hidden_data: p.hidden_data ?? null })) as Post[]
      // Solo los nuevos (no repetir los ya existentes)
      const onlyNew = normalized.filter((p) => !postIds.has(p.id))
      if (onlyNew.length > 0) {
        setPosts((prev) => [...onlyNew, ...prev])
      }
      // Si devolvió menos que PAGE_SIZE, podría significar que no hay tantos nuevos, pero no afecta hasMore
    } catch (e) {
      console.error(e)
      setError("No se pudo actualizar el feed.")
    } finally {
      setIsRefreshing(false)
    }
  }

  async function loadMore() {
    if (!hasMore) return
    try {
      setIsLoadingMore(true)
      const url = `/api/posts?candidate_id=${candidateId}&limit=${PAGE_SIZE}&offset=${posts.length}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Error al cargar más")

      const data: any[] = await res.json()
      const normalized = data.map((p: any) => ({ ...p, hidden_data: p.hidden_data ?? null })) as Post[]
      setPosts((prev) => [...prev, ...normalized])
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
      setError("No se pudo cargar más contenido.")
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handlePostCreated = () => {
    // al crear un post, refrescamos arriba
    refreshFeed()
  }

  const handlePostInteraction = async (
    postId: number,
    interactionType: string
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
        })
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

  // Filtrar posts por tipo de contenido
  const hechosPosts = posts.filter((post) => post.contentType === "hecho")
  const opinionPosts = posts.filter((post) => post.contentType === "opinion")
  const rumorPosts = posts.filter((post) => post.contentType === "rumor")

  // Calcular estadísticas
  const totalInteractions = posts.reduce((sum, post) => sum + post.confirms + post.agrees + post.disagrees, 0)
  const totalShares = posts.reduce((sum, post) => sum + post.shares, 0)
  const averageEngagement = posts.length > 0 ? Math.round(totalInteractions / posts.length) : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones sobre {candidateName}</CardTitle>
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
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones sobre {candidateName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadCandidatePosts}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Publicaciones sobre {candidateName}</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {posts.length} publicaciones
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {/* Estadísticas de engagement */}
        {posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-lg font-bold text-blue-600">{posts.length}</span>
              </div>
              <div className="text-xs text-gray-600">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-lg font-bold text-green-600">{totalInteractions}</span>
              </div>
              <div className="text-xs text-gray-600">Interacciones</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-purple-600 mr-1" />
                <span className="text-lg font-bold text-purple-600">{totalShares}</span>
              </div>
              <div className="text-xs text-gray-600">Compartidos</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <BarChart3 className="w-4 h-4 text-orange-600 mr-1" />
                <span className="text-lg font-bold text-orange-600">{averageEngagement}</span>
              </div>
              <div className="text-xs text-gray-600">Promedio</div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Todas
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{posts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="hechos" className="flex items-center gap-2">
              Hechos
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">{hechosPosts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="opiniones" className="flex items-center gap-2">
              Opiniones
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{opinionPosts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="rumores" className="flex items-center gap-2">
              Rumores
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{rumorPosts.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} onInteraction={handlePostInteraction} userInteractions={userInteractions} isGuest ={isGuest}/>)
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay publicaciones aún</h3>
                    <p className="text-gray-600 mb-4">
                      ¡Sé el primero en escribir sobre {candidateName}! Usa el formulario de arriba para crear una
                      publicación.
                    </p>
                    <div className="text-sm text-gray-500">
                      💡 Tip: Comparte hechos, opiniones o rumores sobre este candidato
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hechos" className="mt-6">
            <div className="space-y-4">
              {hechosPosts.length > 0 ? (
                hechosPosts.map((post) => <PostCard key={post.id} post={post} onInteraction={handlePostInteraction} userInteractions={userInteractions} isGuest ={isGuest}/>)
              ) : (
                <div className="text-center py-12">
                  <div className="bg-green-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-green-900 mb-2">No hay hechos publicados</h3>
                    <p className="text-green-700 mb-4">
                      Comparte información verificable y objetiva sobre {candidateName}.
                    </p>
                    <div className="text-sm text-green-600">✅ Los hechos ayudan a informar mejor a la ciudadanía</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opiniones" className="mt-6">
            <div className="space-y-4">
              {opinionPosts.length > 0 ? (
                opinionPosts.map((post) => <PostCard key={post.id} post={post} onInteraction={handlePostInteraction} userInteractions={userInteractions} isGuest ={isGuest}/>)
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">No hay opiniones publicadas</h3>
                    <p className="text-blue-700 mb-4">Comparte tu punto de vista y análisis sobre {candidateName}.</p>
                    <div className="text-sm text-blue-600">💭 Las opiniones enriquecen el debate político</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rumores" className="mt-6">
            <div className="space-y-4">
              {rumorPosts.length > 0 ? (
                rumorPosts.map((post) => <PostCard key={post.id} post={post} onInteraction={handlePostInteraction} userInteractions={userInteractions} isGuest ={isGuest}/>)
              ) : (
                <div className="text-center py-12">
                  <div className="bg-orange-50 rounded-lg p-8">
                    <h3 className="text-lg font-medium text-orange-900 mb-2">No hay rumores publicados</h3>
                    <p className="text-orange-700 mb-4">
                      Información no confirmada sobre {candidateName} aparecerá aquí.
                    </p>
                    <div className="text-sm text-orange-600">
                      ⚠️ Recuerda verificar la información antes de compartir
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={isLoadingMore || !hasMore}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {isLoadingMore ? "Cargando…" : hasMore ? "Cargar más" : "No hay más publicaciones"}
          </button>
        </div>
      )}

      {/* Sentinel para auto-infinite scroll (opcional) */}
      <div ref={loadMoreRef} />
    </Card>
  )
}
