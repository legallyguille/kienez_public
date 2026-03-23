import { notFound } from "next/navigation"
import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SinglePostView } from "@/components/single-post-view"

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

async function getPost(postId: string): Promise<Post | null> {
  try {
    const sql = await getPool()
    const posts = await sql.query(
      `
      SELECT 
        p.id, p.content, p.image_url, p.video_url, p.post_type, p.original_post_id,
        p.confirms, p.agrees, p.disagrees, p.shares, p.comments, p.created_at,
        p.es_hecho, p.es_opinion, p.es_rumor,
        u.id as user_id, u.nombre, u.apellido, u.alias, u.datos_ocultos,
        pi.image_data as profile_image_url,
        pimg.image_data as post_image_data,
        c.id as candidate_id, c.nombre as candidate_name, c.partido as candidate_party, c.tipo_candidatura,
        op.content as original_content,
        ou.nombre as original_author_name, ou.apellido as original_author_lastname, ou.alias as original_author_alias
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN candidates c ON p.candidate_id = c.id
      LEFT JOIN posts op ON p.original_post_id = op.id
      LEFT JOIN users ou ON op.user_id = ou.id
      LEFT JOIN profile_images pi ON u.id = pi.user_id
      LEFT JOIN post_images pimg ON p.image_url::integer = pimg.id
      WHERE p.id = $1 AND p.is_active = true
    `,
      [Number.parseInt(postId)],
    )

    if (posts.rows.length === 0) {
      return null
    }

    const post = posts.rows[0]

    return {
      id: post.id,
      userId: post.user_id,
      author: `${post.nombre} ${post.apellido}`,
      username: `@${post.alias}`,
      hidden_data: post.datos_ocultos,
      profileImageUrl: post.profile_image_url,
      avatar: `${post.nombre.charAt(0)}${post.apellido.charAt(0)}`,
      content: post.content,
      imageUrl: post.post_image_data,
      videoUrl: post.video_url,
      timestamp: formatTimestamp(post.created_at),
      confirms: post.confirms,
      agrees: post.agrees,
      disagrees: post.disagrees,
      shares: post.shares,
      comments: post.comments,
      isShared: post.post_type === "share",
      contentType: post.es_hecho ? "hecho" : post.es_opinion ? "opinion" : "rumor",
      originalAuthor:
        post.original_author_name && post.original_author_lastname
          ? `${post.original_author_name} ${post.original_author_lastname}`
          : undefined,
      originalContent: post.original_content,
      candidate: post.candidate_name
        ? {
            id: post.candidate_id,
            name: post.candidate_name,
            party: post.candidate_party,
            type: post.tipo_candidatura,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}

function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const postDate = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return "Ahora"
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `Hace ${hours} hora${hours !== 1 ? "s" : ""}`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `Hace ${days} día${days !== 1 ? "s" : ""}`
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  const currentUser = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header with back button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al feed
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Publicación</h1>
        </div>

        {/* Post content */}
        <div className="space-y-4">
          <SinglePostView initialPost={post} />
        </div>

        {/* Additional context or related posts could go here */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Ver más publicaciones</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
