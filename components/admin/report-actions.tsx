"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Check, X, Eye, Ban } from "lucide-react"
import { useState } from "react"

interface ReportActionsProps {
  reportId: number
  currentStatus: string
  postId: number
}

export function ReportActions({ reportId, currentStatus, postId }: ReportActionsProps) {
  const [loading, setLoading] = useState(false)

  const updateReportStatus = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("Error updating report:", error)
      alert("Error al actualizar el reporte")
    } finally {
      setLoading(false)
    }
  }

  const deactivatePost = async () => {
    if (
      !confirm("¿Estás seguro de que quieres inactivar esta publicación? Esta acción no se puede deshacer fácilmente.")
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/posts/${postId}/deactivate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Also mark the report as resolved when post is deactivated
        await updateReportStatus("resolved")
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("Error deactivating post:", error)
      alert("Error al inactivar la publicación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === "pending" && (
          <>
            <DropdownMenuItem onClick={() => updateReportStatus("reviewed")}>
              <Eye className="w-4 h-4 mr-2" />
              Marcar como revisado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateReportStatus("resolved")}>
              <Check className="w-4 h-4 mr-2" />
              Resolver reporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateReportStatus("dismissed")}>
              <X className="w-4 h-4 mr-2" />
              Desestimar reporte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={deactivatePost} className="text-red-600">
              <Ban className="w-4 h-4 mr-2" />
              Inactivar publicación
            </DropdownMenuItem>
          </>
        )}
        {currentStatus === "reviewed" && (
          <>
            <DropdownMenuItem onClick={() => updateReportStatus("resolved")}>
              <Check className="w-4 h-4 mr-2" />
              Resolver reporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateReportStatus("dismissed")}>
              <X className="w-4 h-4 mr-2" />
              Desestimar reporte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={deactivatePost} className="text-red-600">
              <Ban className="w-4 h-4 mr-2" />
              Inactivar publicación
            </DropdownMenuItem>
          </>
        )}
        {(currentStatus === "resolved" || currentStatus === "dismissed") && (
          <DropdownMenuItem onClick={() => updateReportStatus("pending")}>Volver a pendiente</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
