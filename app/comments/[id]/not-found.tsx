import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileX, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <FileX className="w-16 h-16 text-gray-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Publicación no encontrada</h1>
          <p className="text-gray-600">
            La publicación que buscas no existe, fue eliminada o no tienes permisos para verla.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al feed principal
            </Button>
          </Link>

          <Link href="/profile">
            <Button variant="outline" className="w-full bg-transparent">
              Ir a mi perfil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
