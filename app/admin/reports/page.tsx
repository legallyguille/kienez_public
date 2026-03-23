import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportActions } from "@/components/admin/report-actions"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface Report {
  id: number
  user_id: number
  post_id: number
  reason: string
  description: string
  status: string
  created_at: string
  reporter_name: string
  reporter_alias: string
  post_content: string
  post_author: string
  post_author_alias: string
}

async function getReports(status?: string): Promise<Report[]> {
  const pool = await getPool()

  let query = `
    SELECT 
      r.id,
      r.user_id,
      r.post_id,
      r.reason,
      r.description,
      r.status,
      r.created_at,
      u.nombre || ' ' || u.apellido as reporter_name,
      u.alias as reporter_alias,
      p.content as post_content,
      pu.nombre || ' ' || pu.apellido as post_author,
      pu.alias as post_author_alias
    FROM reports r
    JOIN users u ON r.user_id = u.id
    JOIN posts p ON r.post_id = p.id
    JOIN users pu ON p.user_id = pu.id
  `

  const params: any[] = []

  if (status) {
    query += ` WHERE r.status = $1`
    params.push(status)
  }

  query += ` ORDER BY r.created_at DESC`

  const result = await pool.query(query, params)
  return result.rows
}

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  harassment: "Acoso",
  "hate-speech": "Discurso de odio",
  misinformation: "Información falsa",
  violence: "Contenido violento",
  inappropriate: "Contenido inapropiado",
  copyright: "Derechos de autor",
  other: "Otro",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
  dismissed: "Desestimado",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
}

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/")
  }

  const allReports = await getReports()
  const pendingReports = await getReports("pending")
  const reviewedReports = await getReports("reviewed")
  const resolvedReports = await getReports("resolved")

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Link href="/">
        <Button variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
        <p className="text-gray-600 mt-2">Administra los reportes de publicaciones de la comunidad</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Revisados</TabsTrigger>
          <TabsTrigger value="resolved">Resueltos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReportsList reports={pendingReports} />
        </TabsContent>

        <TabsContent value="reviewed">
          <ReportsList reports={reviewedReports} />
        </TabsContent>

        <TabsContent value="resolved">
          <ReportsList reports={resolvedReports} />
        </TabsContent>

        <TabsContent value="all">
          <ReportsList reports={allReports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportsList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No hay reportes en esta categoría</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={statusColors[report.status]}>
                    {statusLabels[report.status]}
                  </Badge>
                  <Badge variant="secondary">{reasonLabels[report.reason]}</Badge>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {report.reporter_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    Reportado por <strong>{report.reporter_name}</strong> (@{report.reporter_alias})
                  </span>
                </div>
              </div>
              <ReportActions reportId={report.id} currentStatus={report.status} postId={report.post_id} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.description && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Descripción del reporte:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{report.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Publicación reportada:</h4>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {report.post_author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{report.post_author}</span>
                    <span className="text-sm text-gray-500">@{report.post_author_alias}</span>
                  </div>
                  <p className="text-sm text-gray-800">{report.post_content}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
